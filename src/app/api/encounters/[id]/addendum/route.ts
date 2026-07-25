import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy, getCurrentStaff } from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "Addendum text is required" }, { status: 400 });
  }

  const pharmacy = await getCurrentPharmacy(req);
  if (!pharmacy) return NextResponse.json({ error: "No pharmacy context" }, { status: 400 });
  const staff = await getCurrentStaff(pharmacy.id);
  if (!staff) return NextResponse.json({ error: "No staff context" }, { status: 400 });

  const encounter = await prisma.encounter.findUnique({
    where: { id },
  });

  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  let addendums: any[] = [];
  try {
    addendums = JSON.parse(encounter.addendums || "[]");
  } catch (e) {
    addendums = [];
  }

  addendums.push({
    text,
    addedAt: new Date().toISOString(),
    staffName: staff.fullName,
  });

  const updated = await prisma.encounter.update({
    where: { id },
    data: {
      addendums: JSON.stringify(addendums),
    },
    include: {
      patient: true,
      staff: { select: { fullName: true } },
      complaint: true,
      hpcs: true,
      historySnapshot: true,
      ros: true,
      assessment: true,
      managementPlan: true,
    },
  });

  return NextResponse.json({ encounter: updated });
}
