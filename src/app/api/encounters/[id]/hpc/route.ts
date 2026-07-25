import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface HpcInput {
  complaintSegment: string;
  questionsGenerated: unknown[];
  answersGiven: unknown[];
  freeTextAdditions?: string;
}

interface HpcPayload {
  segments: HpcInput[];
  hpcAudioUrl?: string | null;
  hpcVoiceTranscript?: string | null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const payload: HpcPayload = await req.json();

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
  
  if (payload.segments && payload.segments.length > 0) {
    await prisma.hpc.createMany({
      data: payload.segments.map((s) => ({
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
