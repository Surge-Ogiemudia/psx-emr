import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy, getCurrentStaff } from "@/lib/tenant";
import { sendPosHandoff } from "@/lib/pos";

export async function POST(req: NextRequest) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) {
    return NextResponse.json({ error: "No pharmacy found" }, { status: 400 });
  }
  const staff = await getCurrentStaff(pharmacy.id);
  if (!staff) {
    return NextResponse.json({ error: "No staff found" }, { status: 400 });
  }

  const body = await req.json();
  const { patientName, patientPhone, ailments, medicines } = body as {
    patientName?: string;
    patientPhone?: string;
    ailments: string[];
    medicines: { name: string; dose: string; qty: number; productId?: string; price?: number }[];
  };

  if (!ailments || ailments.length === 0) {
    return NextResponse.json({ error: "At least one ailment is required" }, { status: 400 });
  }
  if (!medicines || medicines.length === 0) {
    return NextResponse.json({ error: "At least one medicine is required" }, { status: 400 });
  }

  // 1. Patient — find existing or create
  let patient;
  const hasPatientInfo = patientName?.trim() && patientPhone?.trim();

  if (hasPatientInfo) {
    // Try to find existing patient by phone
    patient = await prisma.patient.findFirst({
      where: {
        pharmacyId: pharmacy.id,
        phoneNumber: patientPhone!.trim(),
      },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          pharmacyId: pharmacy.id,
          branchId: staff.branchId,
          fullName: patientName!.trim(),
          phoneNumber: patientPhone!.trim(),
          consentGiven: true,
          consentTimestamp: new Date(),
          isWalkIn: true,
        },
      });
    }
  } else {
    // Anonymous walk-in
    patient = await prisma.patient.create({
      data: {
        pharmacyId: pharmacy.id,
        branchId: staff.branchId,
        fullName: patientName?.trim() || "Walk-in",
        phoneNumber: patientPhone?.trim() || `walkin-${Date.now()}`,
        consentGiven: true,
        consentTimestamp: new Date(),
        isWalkIn: true,
      },
    });
  }

  // 2. Create encounter (immediately complete)
  const encounter = await prisma.encounter.create({
    data: {
      patientId: patient.id,
      pharmacyId: pharmacy.id,
      branchId: staff.branchId,
      staffId: staff.id,
      status: "complete",
      exitType: "treated",
    },
  });

  // 3. Create complaint record (ailments as text)
  const ailmentText = ailments.join(", ");
  await prisma.complaint.create({
    data: {
      encounterId: encounter.id,
      textInput: ailmentText,
      gemmaSummary: `Quick Dispense: ${ailmentText}`,
    },
  });

  // 4. POS handoff
  const dispensedMedicines = medicines.map((m) => ({
    name: m.name,
    dose: m.dose,
    qty: m.qty,
    interim: false,
    productId: m.productId,
    price: m.price,
  }));

  let linkedTransactionId: string | null = null;
  if (dispensedMedicines.length > 0) {
    const handoff = await sendPosHandoff({
      patientId: patient.id,
      medicines: dispensedMedicines,
    });
    linkedTransactionId = handoff.transactionId;
  }

  // 5. Create management plan
  await prisma.managementPlan.create({
    data: {
      encounterId: encounter.id,
      exitType: "treated",
      medicinesDispensed: JSON.stringify(dispensedMedicines),
      linkedTransactionId,
    },
  });

  // 6. Update last visit
  await prisma.patient.update({
    where: { id: patient.id },
    data: { lastVisitAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    encounterId: encounter.id,
    patientName: patient.fullName,
    ailments: ailmentText,
    medicinesCount: dispensedMedicines.length,
    linkedTransactionId,
  });
}
