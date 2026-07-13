import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPosHandoff } from "@/lib/pos";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const body = await req.json();

  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
  });
  if (!encounter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const medicines = body.medicinesDispensed ?? [];

  let linkedTransactionId: string | null = null;
  if (medicines.length > 0) {
    const handoff = await sendPosHandoff({
      patientId: encounter.patientId,
      medicines,
    });
    linkedTransactionId = handoff.transactionId;
  }

  const data = {
    exitType: body.exitType,
    diagnosticsRecommended: JSON.stringify(body.diagnosticsRecommended ?? []),
    patientReturning: body.patientReturning ?? null,
    interimTreatment: Boolean(body.interimTreatment),
    referralDetails: body.referralDetails ? JSON.stringify(body.referralDetails) : null,
    medicinesDispensed: JSON.stringify(medicines),
    nonPharmacologicalAdvice: body.nonPharmacologicalAdvice ?? null,
    followUpInstructions: body.followUpInstructions ?? null,
    counsellingNotes: body.counsellingNotes ?? null,
    linkedTransactionId,
  };

  const plan = await prisma.managementPlan.upsert({
    where: { encounterId },
    update: data,
    create: { encounterId, ...data },
  });

  // Exit A "continue later" pauses the encounter rather than closing it.
  const isPausedForDiagnostics =
    body.exitType === "diagnostic" && body.patientReturning === true;

  const newStatus = isPausedForDiagnostics ? "diagnostic_pending" : "complete";

  await prisma.encounter.update({
    where: { id: encounterId },
    data: { status: newStatus, exitType: body.exitType },
  });

  await prisma.patient.update({
    where: { id: encounter.patientId },
    data: { lastVisitAt: new Date() },
  });

  return NextResponse.json({ plan, linkedTransactionId, status: newStatus });
}
