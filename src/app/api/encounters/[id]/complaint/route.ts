import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEncounterAccess } from "@/lib/access";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const access = await requireEncounterAccess(encounterId);
  if (access instanceof NextResponse) return access;
  const body = await req.json();

  const data = {
    voiceTranscript: body.voiceTranscript ?? null,
    audioUrl: body.audioUrl ?? null,
    images: JSON.stringify(body.images ?? []),
    files: JSON.stringify(body.files ?? []),
    textInput: body.textInput ?? null,
    gemmaSummary: body.gemmaSummary ?? null,
    complaintSegments: JSON.stringify(body.complaintSegments ?? []),
  };

  const complaint = await prisma.complaint.upsert({
    where: { encounterId },
    update: data,
    create: { encounterId, ...data },
  });

  return NextResponse.json({ complaint });
}
