import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Marks a diagnostic_pending encounter as resumed once the patient returns
 * with results. The UI then routes on to Exit B/C to close the encounter
 * properly (PRD Section 6, Exit A "Continue later").
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const body = await req.json();

  const complaint = await prisma.complaint.update({
    where: { encounterId },
    data: {
      files: JSON.stringify(body.resultFiles ?? []),
      gemmaSummary: body.resultSummary ?? null,
    },
  });

  const encounter = await prisma.encounter.update({
    where: { id: encounterId },
    data: { status: "diagnostic_resumed" },
  });

  return NextResponse.json({ encounter, complaint });
}
