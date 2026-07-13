import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const body = await req.json();

  const data = {
    ageAtVisit: body.ageAtVisit ?? null,
    gender: body.gender ?? null,
    conditions: JSON.stringify(body.conditions ?? []),
    medications: JSON.stringify(body.medications ?? []),
    allergies: JSON.stringify(body.allergies ?? []),
    bloodPressure: body.bloodPressure ?? null,
    temperature: body.temperature ?? null,
    bloodSugar: body.bloodSugar ?? null,
    pulse: body.pulse ?? null,
    weight: body.weight ?? null,
    isPregnant: body.isPregnant ?? null,
    isBreastfeeding: body.isBreastfeeding ?? null,
  };

  const snapshot = await prisma.patientHistorySnapshot.upsert({
    where: { encounterId },
    update: data,
    create: { encounterId, ...data },
  });

  return NextResponse.json({ snapshot });
}
