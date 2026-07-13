import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";

/**
 * Patient identification matching (PRD Section 6, Step 1).
 *
 * Signals: name (typed, live), phone (typed, live), face (stubbed — always
 * ignored until face-api.js is wired in). Strong match = two or more
 * signals align -> open automatically. Weak match = one signal -> return
 * candidates for staff to confirm visually. No match -> null, caller
 * should offer new-patient creation pre-filled with what was typed.
 */
export async function POST(req: NextRequest) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) {
    return NextResponse.json({ error: "No pharmacy found" }, { status: 400 });
  }

  const { name, phone }: { name?: string; phone?: string } = await req.json();

  const nameTrim = name?.trim();
  const phoneTrim = phone?.trim();

  const [phoneMatches, nameMatches] = await Promise.all([
    phoneTrim
      ? prisma.patient.findMany({
          where: { pharmacyId: pharmacy.id, phoneNumber: phoneTrim },
        })
      : Promise.resolve([]),
    nameTrim
      ? prisma.patient.findMany({
          where: {
            pharmacyId: pharmacy.id,
            fullName: { contains: nameTrim },
          },
        })
      : Promise.resolve([]),
  ]);

  const phoneIds = new Set(phoneMatches.map((p) => p.id));
  const strongMatch = nameMatches.find((p) => phoneIds.has(p.id));

  if (strongMatch) {
    return NextResponse.json({ result: "strong", patient: strongMatch });
  }

  const candidates = [...phoneMatches, ...nameMatches].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
  );

  if (candidates.length > 0) {
    return NextResponse.json({ result: "weak", candidates });
  }

  return NextResponse.json({
    result: "none",
    prefill: { fullName: nameTrim ?? "", phoneNumber: phoneTrim ?? "" },
  });
}
