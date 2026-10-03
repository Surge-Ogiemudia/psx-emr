import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy, getCurrentStaff } from "@/lib/tenant";
import { pharmacyOwnsPatient } from "@/lib/access";

export async function POST(req: NextRequest) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) {
    return NextResponse.json({ error: "No pharmacy found" }, { status: 400 });
  }
  const staff = await getCurrentStaff(pharmacy.id);
  if (!staff) {
    return NextResponse.json({ error: "No staff found" }, { status: 400 });
  }

  const { patientId } = await req.json();
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }
  if (!(await pharmacyOwnsPatient(pharmacy.id, patientId))) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const encounter = await prisma.encounter.create({
    data: {
      patientId,
      pharmacyId: pharmacy.id,
      branchId: staff.branchId,
      staffId: staff.id,
      status: "active",
    },
  });

  return NextResponse.json({ encounter });
}
