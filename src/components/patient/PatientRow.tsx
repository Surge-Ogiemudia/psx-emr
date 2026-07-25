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
    (lastEncounter ? "Encounter recorded" : "New patient profile");

  let statusBadge: { label: string; bg: string; color: string } | null = null;
  if (lastEncounter?.status === "diagnostic_pending") {
    statusBadge = { label: "⏳ Pending Lab/Rx", bg: "#fef3c7", color: "#b45309" };
  } else if (lastEncounter?.exitType === "referred") {
    statusBadge = { label: "→ Referred Out", bg: "#e0e7ff", color: "#4338ca" };
  } else if (lastEncounter?.status === "complete") {
    statusBadge = { label: "✓ Encounter Complete", bg: "#d1fae5", color: "#047857" };
  }

  const initials = getInitials(patient.fullName);

  return (
    <Link href={`/patients/${patient.id}`} style={{
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      background: "#ffffff",
      borderRadius: "18px",
      padding: "16px 18px",
      border: "1px solid #e4e4e7",
      boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      width: "100%",
      textAlign: "left"
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 10px 28px -6px rgba(15,118,110,0.18)";
      e.currentTarget.style.borderColor = "rgba(15,118,110,0.4)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 16px -4px rgba(0,0,0,0.04)";
      e.currentTarget.style.borderColor = "#e4e4e7";
    }}
    >
      <div style={{
        width: "46px",
        height: "46px",
        borderRadius: "14px",
        background: "linear-gradient(135deg, #0f766e 0%, #0284c7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: 800,
        color: "#ffffff",
        flexShrink: 0,
        boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)"
      }}>
        {initials}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "#18181b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {patient.fullName}
          </span>
          {allergies.length > 0 && (
            <span style={{
              fontSize: "10px",
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: "6px",
              background: "#fee2e2",
              color: "#dc2626",
              whiteSpace: "nowrap"
            }}>
              ⚠️ {allergies.length} Allergy
            </span>
          )}
        </div>

        <div style={{ fontSize: "13px", color: "#71717a", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ fontWeight: 600, color: "#52525b" }}>
            {patient.lastVisitAt ? formatRelative(patient.lastVisitAt) : "New Patient"}
          </span>
          {" · "}
          <span>{complaintSummary}</span>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "10px" }}>
        {statusBadge && (
          <span style={{ 
            fontSize: "11px", 
            fontWeight: 700, 
            padding: "4px 10px", 
            borderRadius: "10px", 
            background: statusBadge.bg, 
            color: statusBadge.color,
            whiteSpace: "nowrap"
          }}>
            {statusBadge.label}
          </span>
        )}
        <span style={{ fontSize: "16px", color: "#0d9488", fontWeight: 700 }}>→</span>
      </div>
    </Link>
  );
}
