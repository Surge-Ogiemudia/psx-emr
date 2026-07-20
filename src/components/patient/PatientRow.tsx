import Link from "next/link";
import { initials as getInitials, formatRelative } from "@/lib/format";
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

  let statusBadge: { label: string; bg: string; color: string } | null = null;
  if (allergies.length > 0) {
    statusBadge = { label: "⚠ Allergy", bg: "#fee2e2", color: "#b91c1c" };
  } else if (lastEncounter?.status === "diagnostic_pending") {
    statusBadge = { label: "⏳ Pending", bg: "#fef3c7", color: "#b45309" };
  } else if (lastEncounter?.exitType === "referred") {
    statusBadge = { label: "→ Referred", bg: "#e0e7ff", color: "#4338ca" };
  } else if (lastEncounter?.status === "complete") {
    statusBadge = { label: "✓ Done", bg: "#d1fae5", color: "#047857" };
  }

  const initials = getInitials(patient.fullName);

  return (
    <Link href={`/patients/${patient.id}`} style={{
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      background: "#ffffff",
      borderRadius: "16px",
      padding: "16px",
      border: "1px solid #e4e4e7",
      boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      width: "100%",
      textAlign: "left"
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 8px 24px -6px rgba(15,118,110,0.15)";
      e.currentTarget.style.borderColor = "rgba(15,118,110,0.3)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 20px -6px rgba(0,0,0,0.05)";
      e.currentTarget.style.borderColor = "#e4e4e7";
    }}
    >
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        fontWeight: 700,
        color: "white",
        flexShrink: 0,
        boxShadow: "0 4px 10px rgba(99, 102, 241, 0.3)"
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#18181b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{patient.fullName}</div>
        <div style={{ fontSize: "13px", color: "#71717a", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {patient.lastVisitAt ? formatRelative(patient.lastVisitAt) : "New patient"} ·{" "}
          {complaintSummary}
        </div>
      </div>
      {statusBadge && (
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ 
            fontSize: "11px", 
            fontWeight: 700, 
            padding: "4px 8px", 
            borderRadius: "8px", 
            background: statusBadge.bg, 
            color: statusBadge.color,
            whiteSpace: "nowrap"
          }}>
            {statusBadge.label}
          </span>
        </div>
      )}
    </Link>
  );
}
