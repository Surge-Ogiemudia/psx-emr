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
    
    socialHistory: body.socialHistory ?? null,
    familyHistory: body.familyHistory ?? null,
    surgicalHistory: body.surgicalHistory ?? null,
    additionalNotes: body.additionalNotes ?? null,
    historyAudioUrl: body.historyAudioUrl ?? null,
    historyVoiceTranscript: body.historyVoiceTranscript ?? null,
    aiRiskAnalysis: body.aiRiskAnalysis ?? null,

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

  // Sync back to Patient Profile
  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    select: { patientId: true },
  });

  if (encounter) {
    let dateOfBirth = undefined;
    if (body.ageAtVisit) {
      const today = new Date();
      dateOfBirth = new Date(today.getFullYear() - body.ageAtVisit, today.getMonth(), today.getDate());
    }

    await prisma.patient.update({
      where: { id: encounter.patientId },
      data: {
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(body.gender ? { gender: body.gender } : {}),
        chronicConditions: JSON.stringify(body.conditions ?? []),
        currentMedications: JSON.stringify(body.medications ?? []),
        knownAllergies: JSON.stringify(body.allergies ?? []),
      }
    });
  }

  return NextResponse.json({ snapshot });
}
