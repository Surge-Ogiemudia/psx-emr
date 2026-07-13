import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const body = await req.json();

  const data = {
    questionsGenerated: JSON.stringify(body.questionsGenerated ?? []),
    answersGiven: JSON.stringify(body.answersGiven ?? []),
  };

  const ros = await prisma.reviewOfSystems.upsert({
    where: { encounterId },
    update: data,
    create: { encounterId, ...data },
  });

  return NextResponse.json({ ros });
}
