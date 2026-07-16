import type { AllergySeverity, ReferralUrgency, RosAnswer } from "./enums";

export interface Allergy {
  substance: string;
  severity: AllergySeverity;
  note?: string;
}

export interface Medication {
  name: string;
  dose?: string;
}

export interface ComplaintSegment {
  label: string;
  summary: string;
}

export interface HpcQuestion {
  question: string;
  options: string[];
}

export interface HpcAnswer {
  question: string;
  answer: string;
}

export interface RosAnswerEntry {
  question: string;
  answer: RosAnswer;
}

export interface DispensedMedicine {
  name: string;
  dose: string;
  qty: number;
  interim: boolean;
  productId?: string;
  price?: number;
}

export interface ReferralDetails {
  referredTo: string;
  reason: string;
  urgency: ReferralUrgency;
}

/** Parse a JSON-string field from the DB, falling back to a default on any error. */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
