import Link from "next/link";
import { initials, formatRelative } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type { Allergy } from "@/lib/types";

export interface PatientRowData {
  id: string;
  fullName: string;
  lastVisitAt: string | Date | null;
  knownAllergies: string;
  encounters: {
    status: string;
    exitType: string | null;
    complaint: { gemmaSummary: string | null; textInput: string | null } | null;
  }[];
}

export default function PatientRow({ patient }: { patient: PatientRowData }) {
  const allergies = parseJson<Allergy[]>(patient.knownAllergies, []);
  const lastEncounter = patient.encounters[0];
  const complaintSummary =
    lastEncounter?.complaint?.gemmaSummary ??
    lastEncounter?.complaint?.textInput ??
    (lastEncounter ? "Encounter on file" : "No visits yet");

  let statusBadge: { label: string; cls: string } | null = null;
  if (allergies.length > 0) {
    statusBadge = { label: "⚠ Allergy", cls: "badge-red" };
  } else if (lastEncounter?.status === "diagnostic_pending") {
    statusBadge = { label: "⏳ Pending", cls: "badge-amber" };
  } else if (lastEncounter?.exitType === "referred") {
    statusBadge = { label: "→ Referred", cls: "badge-blue" };
  } else if (lastEncounter?.status === "complete") {
    statusBadge = { label: "✓ Done", cls: "badge-green" };
  }

  return (
    <Link href={`/patients/${patient.id}`} className="patient-row">
      <div className="avatar">{initials(patient.fullName)}</div>
      <div className="patient-info">
        <div className="name">{patient.fullName}</div>
        <div className="meta">
          {patient.lastVisitAt ? formatRelative(patient.lastVisitAt) : "New patient"} ·{" "}
          {complaintSummary}
        </div>
      </div>
      {statusBadge && (
        <div className="badges">
          <span className={`badge ${statusBadge.cls}`}>{statusBadge.label}</span>
        </div>
      )}
    </Link>
  );
}
