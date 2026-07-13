import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface HpcInput {
  complaintSegment: string;
  questionsGenerated: unknown[];
  answersGiven: unknown[];
  freeTextAdditions?: string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const segments: HpcInput[] = await req.json();

  await prisma.hpc.deleteMany({ where: { encounterId } });
  await prisma.hpc.createMany({
    data: segments.map((s) => ({
      encounterId,
      complaintSegment: s.complaintSegment,
      questionsGenerated: JSON.stringify(s.questionsGenerated ?? []),
      answersGiven: JSON.stringify(s.answersGiven ?? []),
      freeTextAdditions: s.freeTextAdditions ?? null,
    })),
  });

  const hpcs = await prisma.hpc.findMany({ where: { encounterId } });
  return NextResponse.json({ hpcs });
}
