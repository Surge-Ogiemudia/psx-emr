import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface HpcInput {
  complaintSegment: string;
  questionsGenerated: unknown[];
  answersGiven: unknown[];
  freeTextAdditions?: string;
}

interface HpcPayload {
  segments?: HpcInput[];
  hpcs?: HpcInput[];
  hpcAudioUrl?: string | null;
  hpcVoiceTranscript?: string | null;
}

async function handleHpcSave(req: NextRequest, encounterId: string) {
  const payload: HpcPayload = await req.json();
  const items = payload.hpcs || payload.segments || [];

  // Save the global audio/transcript to the Encounter record
  await prisma.encounter.update({
    where: { id: encounterId },
    data: {
      hpcAudioUrl: payload.hpcAudioUrl,
      hpcVoiceTranscript: payload.hpcVoiceTranscript,
    }
  });

  // Handle the HPC segments
  await prisma.hpc.deleteMany({ where: { encounterId } });
  
  if (items.length > 0) {
    await prisma.hpc.createMany({
      data: items.map((s) => ({
        encounterId,
        complaintSegment: s.complaintSegment,
        questionsGenerated: JSON.stringify(s.questionsGenerated ?? []),
        answersGiven: JSON.stringify(s.answersGiven ?? []),
        freeTextAdditions: s.freeTextAdditions ?? null,
      })),
    });
  }

  const hpcs = await prisma.hpc.findMany({ where: { encounterId } });
  return NextResponse.json({ hpcs });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  return handleHpcSave(req, encounterId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  return handleHpcSave(req, encounterId);
}
