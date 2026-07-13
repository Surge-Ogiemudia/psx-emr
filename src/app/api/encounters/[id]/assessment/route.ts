import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const body = await req.json();

  const data = {
    pharmacistImpression: body.pharmacistImpression ?? "",
    gemmaSuggestion: body.gemmaSuggestion ?? null,
    suggestionAccepted: body.suggestionAccepted ?? null,
  };

  const assessment = await prisma.assessment.upsert({
    where: { encounterId },
    update: data,
    create: { encounterId, ...data },
  });

  return NextResponse.json({ assessment });
}
