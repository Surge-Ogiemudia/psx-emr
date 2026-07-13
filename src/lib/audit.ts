import { prisma } from "./prisma";

const AUDITED_PATIENT_FIELDS = [
  "fullName",
  "phoneNumber",
  "dateOfBirth",
  "gender",
  "address",
  "knownAllergies",
  "chronicConditions",
  "currentMedications",
] as const;

/**
 * Compares old vs new patient field values and writes one AuditLog row per
 * changed field. Nothing is ever silently overwritten — every edit to the
 * locked identity section must be traceable to a field, a value, and a staff
 * member (PRD Section 5.2 / Section 12).
 */
export async function logPatientFieldChanges(
  patientId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  changedById: string,
) {
  const entries = AUDITED_PATIENT_FIELDS.filter(
    (field) => field in after && String(before[field] ?? "") !== String(after[field] ?? ""),
  );

  if (entries.length === 0) return;

  await prisma.auditLog.createMany({
    data: entries.map((field) => ({
      recordType: "patient",
      recordId: patientId,
      fieldChanged: field,
      oldValue: before[field] == null ? null : String(before[field]),
      newValue: after[field] == null ? null : String(after[field]),
      changedById,
    })),
  });
}
