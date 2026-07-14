import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy, getCurrentStaff } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) return NextResponse.json({ patients: [] });

  const q = req.nextUrl.searchParams.get("q")?.trim();

  const patients = await prisma.patient.findMany({
    where: {
      pharmacyId: pharmacy.id,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { phoneNumber: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { lastVisitAt: "desc" },
    include: {
      encounters: {
        orderBy: { encounterDate: "desc" },
        take: 1,
        include: { complaint: true },
      },
    },
  });

  return NextResponse.json({ patients });
}

export async function POST(req: NextRequest) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) {
    return NextResponse.json({ error: "No pharmacy found" }, { status: 400 });
  }
  const staff = await getCurrentStaff(pharmacy.id);
  if (!staff) {
    return NextResponse.json({ error: "No staff found" }, { status: 400 });
  }

  const body = await req.json();

  if (!body.fullName || !body.phoneNumber) {
    return NextResponse.json(
      { error: "fullName and phoneNumber are required" },
      { status: 400 },
    );
  }

  const patient = await prisma.patient.create({
    data: {
      pharmacyId: pharmacy.id,
      branchId: staff.branchId,
      fullName: body.fullName,
      phoneNumber: body.phoneNumber,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      gender: body.gender ?? null,
      faceEmbedding: body.faceEmbedding ?? null,
      photoUrl: body.photoUrl ?? null,
      // Consent must be captured explicitly on the consent screen before any
      // clinical data is recorded — never defaulted to true on creation.
      consentGiven: false,
    },
  });

  return NextResponse.json({ patient });
}
