import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getCurrentPharmacy } from "./tenant";

type Pharmacy = NonNullable<Awaited<ReturnType<typeof getCurrentPharmacy>>>;

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** API routes: the logged-in pharmacy, or a 401 response. */
export async function requireApiPharmacy(): Promise<Pharmacy | NextResponse> {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return pharmacy;
}

/**
 * API routes: the logged-in pharmacy, provided the encounter belongs to it.
 * Returns 404 (not 403) for other pharmacies' encounters so IDs can't be probed.
 */
export async function requireEncounterAccess(encounterId: string): Promise<Pharmacy | NextResponse> {
  const pharmacy = await requireApiPharmacy();
  if (pharmacy instanceof NextResponse) return pharmacy;
  if (!(await pharmacyOwnsEncounter(pharmacy.id, encounterId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return pharmacy;
}

/** API routes: the logged-in pharmacy, provided the patient belongs to it. */
export async function requirePatientAccess(patientId: string): Promise<Pharmacy | NextResponse> {
  const pharmacy = await requireApiPharmacy();
  if (pharmacy instanceof NextResponse) return pharmacy;
  if (!(await pharmacyOwnsPatient(pharmacy.id, patientId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return pharmacy;
}

export async function pharmacyOwnsEncounter(pharmacyId: string, encounterId: string): Promise<boolean> {
  if (!OBJECT_ID.test(encounterId)) return false;
  const encounter = await prisma.encounter.findFirst({
    where: { id: encounterId, pharmacyId },
    select: { id: true },
  });
  return !!encounter;
}

export async function pharmacyOwnsPatient(pharmacyId: string, patientId: string): Promise<boolean> {
  if (!OBJECT_ID.test(patientId)) return false;
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, pharmacyId },
    select: { id: true },
  });
  return !!patient;
}
