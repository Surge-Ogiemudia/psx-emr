// Encounter.status / exitType / ManagementPlan.exitType are plain strings
// (not a Prisma enum) constrained to these values by application code.

export const ENCOUNTER_STATUS = {
  active: "active",
  complete: "complete",
  diagnosticPending: "diagnostic_pending",
  diagnosticResumed: "diagnostic_resumed",
} as const;

export type EncounterStatus =
  (typeof ENCOUNTER_STATUS)[keyof typeof ENCOUNTER_STATUS];

export const EXIT_TYPE = {
  treated: "treated",
  referred: "referred",
  diagnostic: "diagnostic",
} as const;

export type ExitType = (typeof EXIT_TYPE)[keyof typeof EXIT_TYPE];

export const ROS_ANSWER = ["yes", "no", "unsure"] as const;
export type RosAnswer = (typeof ROS_ANSWER)[number];

export const ALLERGY_SEVERITY = ["mild", "moderate", "severe"] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITY)[number];

export const REFERRAL_URGENCY = ["routine", "urgent", "emergency"] as const;
export type ReferralUrgency = (typeof REFERRAL_URGENCY)[number];
