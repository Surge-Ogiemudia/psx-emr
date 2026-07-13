import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy, getCurrentStaff } from "@/lib/tenant";
import { logPatientFieldChanges } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      encounters: {
        orderBy: { encounterDate: "desc" },
        include: {
          complaint: true,
          hpcs: true,
          historySnapshot: true,
          ros: true,
          assessment: true,
          managementPlan: true,
          staff: { select: { fullName: true } },
        },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) {
    return NextResponse.json({ error: "No pharmacy found" }, { status: 400 });
  }
  const staff = await getCurrentStaff(pharmacy.id);
  if (!staff) {
    return NextResponse.json({ error: "No staff found" }, { status: 400 });
  }

  const before = await prisma.patient.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};
  for (const key of [
    "fullName",
    "phoneNumber",
    "gender",
    "address",
    "knownAllergies",
    "chronicConditions",
    "currentMedications",
  ]) {
    if (key in body) data[key] = body[key];
  }
  if ("dateOfBirth" in body) {
    data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }
  if ("consentGiven" in body && body.consentGiven === true) {
    data.consentGiven = true;
    data.consentTimestamp = new Date();
  }

  const patient = await prisma.patient.update({ where: { id }, data });

  await logPatientFieldChanges(id, before, data, staff.id);

  return NextResponse.json({ patient });
}
