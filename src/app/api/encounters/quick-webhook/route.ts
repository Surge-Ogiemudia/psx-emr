import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPosHandoff } from "@/lib/pos";

/**
 * Server-to-server webhook for creating Quick Dispense encounters.
 * Called by the POS backend when a sale includes a complaint/ailment.
 * Authenticated via X-Webhook-Secret header (shared secret between POS and EMR).
 */
export async function POST(req: NextRequest) {
  // 1. Auth: check webhook secret
  const secret = req.headers.get("x-webhook-secret");
  const expectedSecret = process.env.EMR_WEBHOOK_SECRET || "psx-emr-webhook-secret-2026";
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    pharmacySlug,
    staffName,
    patientName,
    patientPhone,
    ailments,
    medicines,
  } = body as {
    pharmacySlug: string;
    staffName?: string;
    patientName?: string;
    patientPhone?: string;
    ailments: string[];
    medicines: { name: string; dose?: string; qty: number; price?: number }[];
  };

  if (!pharmacySlug) {
    return NextResponse.json({ error: "pharmacySlug is required" }, { status: 400 });
  }
  if (!ailments || ailments.length === 0) {
    return NextResponse.json({ error: "At least one ailment is required" }, { status: 400 });
  }

  // 2. Resolve pharmacy by slug/subdomain
  const pharmacy = await prisma.pharmacy.findUnique({
    where: { subdomain: pharmacySlug },
  });
  if (!pharmacy) {
    return NextResponse.json({ error: `Pharmacy not found for slug: ${pharmacySlug}` }, { status: 404 });
  }

  // 3. Find a staff member to attribute the encounter to
  const staff = await prisma.staff.findFirst({
    where: { pharmacyId: pharmacy.id },
    orderBy: { createdAt: "asc" },
  });
  if (!staff) {
    return NextResponse.json({ error: "No staff found for pharmacy" }, { status: 404 });
  }

  // 4. Patient — find existing or create walk-in
  let patient;
  const hasPatientInfo = patientName?.trim() && patientPhone?.trim();

  if (hasPatientInfo) {
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
    patient = await prisma.patient.create({
      data: {
        pharmacyId: pharmacy.id,
        branchId: staff.branchId,
        fullName: patientName?.trim() || "Walk-in (POS)",
        phoneNumber: patientPhone?.trim() || `pos-walkin-${Date.now()}`,
        consentGiven: true,
        consentTimestamp: new Date(),
        isWalkIn: true,
      },
    });
  }

  // 5. Create encounter
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

  // 6. Create complaint
  const ailmentText = ailments.join(", ");
  await prisma.complaint.create({
    data: {
      encounterId: encounter.id,
      textInput: ailmentText,
      gemmaSummary: `POS Quick Dispense: ${ailmentText}`,
    },
  });

  // 7. Create management plan with dispensed medicines
  const dispensedMedicines = (medicines || []).map((m) => ({
    name: m.name,
    dose: m.dose || "",
    qty: m.qty,
    interim: false,
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

  await prisma.managementPlan.create({
    data: {
      encounterId: encounter.id,
      exitType: "treated",
      medicinesDispensed: JSON.stringify(dispensedMedicines),
      linkedTransactionId,
    },
  });

  // 8. Update last visit
  await prisma.patient.update({
    where: { id: patient.id },
    data: { lastVisitAt: new Date() },
  });

  console.log(`[EMR-WEBHOOK] Quick Dispense created for "${ailmentText}" at pharmacy "${pharmacySlug}" | Patient: "${patient.fullName}" | Medicines: ${dispensedMedicines.length}`);

  return NextResponse.json({
    success: true,
    encounterId: encounter.id,
    patientName: patient.fullName,
  });
}
