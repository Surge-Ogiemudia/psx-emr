"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type { ComplaintSegment, DispensedMedicine, HpcAnswer, ReferralDetails, RosAnswerEntry } from "@/lib/types";

interface EncounterData {
  id: string;
  encounterDate: string;
  status: string;
  exitType: string | null;
  staff: { fullName: string };
  complaint: { gemmaSummary: string | null; textInput: string | null; complaintSegments: string } | null;
  hpcs: { complaintSegment: string; answersGiven: string }[];
  historySnapshot: {
    bloodPressure: string | null;
    temperature: number | null;
    bloodSugar: number | null;
    pulse: number | null;
    weight: number | null;
  } | null;
  ros: { answersGiven: string } | null;
  assessment: { pharmacistImpression: string } | null;
  managementPlan: {
    exitType: string;
    diagnosticsRecommended: string;
    referralDetails: string | null;
    medicinesDispensed: string | null;
    nonPharmacologicalAdvice: string | null;
    followUpInstructions: string | null;
    counsellingNotes: string | null;
  } | null;
}

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  treated: { label: "✓ Treated", bg: "#d1fae5", color: "#047857" },
  referred: { label: "→ Referred", bg: "#e0e7ff", color: "#4338ca" },
  diagnostic: { label: "⏳ Pending", bg: "#fef3c7", color: "#b45309" },
};

export default function EncounterTimeline({ encounters }: { encounters: EncounterData[] }) {
  const router = useRouter();

  function getResumeLink(e: EncounterData) {
    if (!e.complaint) return `/encounter/${e.id}/complaint`;
    if (e.hpcs.length === 0) return `/encounter/${e.id}/hpc`;
    if (!e.historySnapshot) return `/encounter/${e.id}/history`;
    if (!e.ros) return `/encounter/${e.id}/ros`;
    if (!e.assessment) return `/encounter/${e.id}/assessment`;
    if (!e.managementPlan) return `/encounter/${e.id}/management`;
    return `/encounter/${e.id}/done`;
  }

  if (encounters.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 20px", color: "#a1a1aa", background: "#f4f4f5", borderRadius: "16px", border: "1px dashed #d4d4d8", marginTop: "16px" }}>
        <p style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>No encounters recorded yet.</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", paddingLeft: "16px" }}>
      <div style={{ position: "absolute", left: "20px", top: "16px", bottom: "16px", width: "2px", background: "linear-gradient(180deg, #e4e4e7 0%, rgba(228, 228, 231, 0) 100%)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {encounters.map((e) => {
          const isPending = e.status === "diagnostic_pending";
          const statusInfo = e.exitType ? STATUS_LABEL[e.exitType] : { label: "In progress", bg: "#fef3c7", color: "#b45309" };
          const segments = parseJson<ComplaintSegment[]>(e.complaint?.complaintSegments, []);
          const complaintLabel = e.complaint?.gemmaSummary ?? e.complaint?.textInput ?? segments.map((s) => s.label).join(", ") ?? "Encounter";

          return (
            <div key={e.id} style={{ position: "relative", paddingLeft: "24px" }}>
              <div style={{ position: "absolute", left: "-1px", top: "24px", width: "10px", height: "10px", borderRadius: "50%", background: isPending ? "#f59e0b" : "#e4e4e7", border: "2px solid #ffffff", boxShadow: isPending ? "0 0 0 4px rgba(245, 158, 11, 0.2)" : "none" }} />
              <div style={{
                background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", overflow: "hidden",
                boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                borderColor: isPending ? "rgba(245,158,11,0.3)" : "#e4e4e7"
              }}>
                <div onClick={() => {
                  if (e.status === "active") {
                    router.push(getResumeLink(e));
                  } else {
                    router.push(`/encounter/${e.id}/review`);
                  }
                }} style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", background: "#ffffff" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#a1a1aa", letterSpacing: "0.05em" }}>{formatDateTime(e.encounterDate).toUpperCase()}</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#18181b", marginTop: "4px" }}>{complaintLabel}</div>
                    <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>{e.staff.fullName}</div>
                  </div>
                  <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, whiteSpace: "nowrap" }}>{statusInfo.label}</span>
                </div>

                {isPending && (
                  <Link href={`/encounter/${e.id}/resume`} style={{ display: "block", background: "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)", color: "white", textAlign: "center", padding: "12px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                    Continue from diagnostics →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
