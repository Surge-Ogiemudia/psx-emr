import type { DispensedMedicine } from "./types";

/**
 * POS handoff stub (PRD Section 10). Real implementation posts a structured
 * payload — medicines, quantities, dosage notes, patient ID — to pos.psx.ng
 * so the sale is pre-populated when staff walks back to the counter.
 * Interim medicines from Exit A go through the same handoff, flagged.
 *
 * This stub just mints a fake transaction id so the encounter record has
 * something to link, and logs what would have been sent.
 */
export async function sendPosHandoff(_payload: {
  patientId: string;
  medicines: DispensedMedicine[];
}): Promise<{ transactionId: string }> {
  // TODO: POST to pos.psx.ng's transaction pre-fill endpoint.
  const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}`;
  return { transactionId };
}
