"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [openId, setOpenId] = useState<string | null>(null);

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
          const open = openId === e.id;

          return (
            <div key={e.id} style={{ position: "relative", paddingLeft: "24px" }}>
              <div style={{ position: "absolute", left: "-1px", top: "24px", width: "10px", height: "10px", borderRadius: "50%", background: isPending ? "#f59e0b" : "#e4e4e7", border: "2px solid #ffffff", boxShadow: isPending ? "0 0 0 4px rgba(245, 158, 11, 0.2)" : "none" }} />
              <div style={{
                background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", overflow: "hidden",
                boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                borderColor: isPending ? "rgba(245,158,11,0.3)" : "#e4e4e7"
              }}>
                <div onClick={() => setOpenId(open ? null : e.id)} style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", background: open ? "#fafafa" : "#ffffff" }}>
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

                {open && (
                  <div style={{ borderTop: "1px solid #e4e4e7", background: "#ffffff", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {e.hpcs.map((h, i) => {
                      const answers = parseJson<HpcAnswer[]>(h.answersGiven, []);
                      return (
                        <div key={i} style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                          <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f766e", textTransform: "uppercase", marginBottom: "4px" }}>HPC — {h.complaintSegment}</div>
                          <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5 }}>{answers.map((a) => `${a.question} ${a.answer}`).join("; ") || "—"}</div>
                        </div>
                      );
                    })}

                    {e.historySnapshot && (
                      <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f766e", textTransform: "uppercase", marginBottom: "4px" }}>Vitals</div>
                        <div style={{ fontSize: "13px", color: "#52525b" }}>
                          {[
                            e.historySnapshot.bloodPressure && `BP ${e.historySnapshot.bloodPressure}`,
                            e.historySnapshot.temperature && `Temp ${e.historySnapshot.temperature}°C`,
                            e.historySnapshot.bloodSugar && `Sugar ${e.historySnapshot.bloodSugar}`,
                            e.historySnapshot.pulse && `Pulse ${e.historySnapshot.pulse}bpm`,
                            e.historySnapshot.weight && `Weight ${e.historySnapshot.weight}kg`,
                          ].filter(Boolean).join(" · ") || "None recorded"}
                        </div>
                      </div>
                    )}

                    {e.ros && (
                      <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f766e", textTransform: "uppercase", marginBottom: "4px" }}>Review of systems</div>
                        <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5 }}>
                          {parseJson<RosAnswerEntry[]>(e.ros.answersGiven, []).map((a) => `${a.question}: ${a.answer}`).join("; ") || "—"}
                        </div>
                      </div>
                    )}

                    {e.assessment && (
                      <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f766e", textTransform: "uppercase", marginBottom: "4px" }}>Pharmaceutical assessment</div>
                        <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5 }}>{e.assessment.pharmacistImpression}</div>
                      </div>
                    )}

                    {e.managementPlan && (
                      <>
                        {e.managementPlan.exitType === "diagnostic" && (
                          <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                            <div style={{ fontSize: "11px", fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase", marginBottom: "4px" }}>Diagnostics requested</div>
                            <div style={{ fontSize: "13px", color: "#52525b" }}>{parseJson<string[]>(e.managementPlan.diagnosticsRecommended, []).join(", ") || "—"}</div>
                          </div>
                        )}

                        {e.managementPlan.exitType === "referred" && e.managementPlan.referralDetails && (
                          <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                            <div style={{ fontSize: "11px", fontWeight: 800, color: "#4338ca", textTransform: "uppercase", marginBottom: "4px" }}>Referral</div>
                            <div style={{ fontSize: "13px", color: "#52525b" }}>
                              {(() => {
                                const r = parseJson<ReferralDetails | null>(e.managementPlan.referralDetails, null);
                                return r ? `${r.referredTo} — ${r.reason} (${r.urgency})` : "—";
                              })()}
                            </div>
                          </div>
                        )}

                        {e.managementPlan.medicinesDispensed && (
                          <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                            <div style={{ fontSize: "11px", fontWeight: 800, color: "#8b5cf6", textTransform: "uppercase", marginBottom: "4px" }}>Medicines dispensed</div>
                            <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5 }}>
                              {parseJson<DispensedMedicine[]>(e.managementPlan.medicinesDispensed, []).map((m) => `${m.name} (${m.dose})${m.interim ? " — interim" : ""}`).join(", ") || "—"}
                            </div>
                          </div>
                        )}

                        {e.managementPlan.nonPharmacologicalAdvice && (
                          <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                            <div style={{ fontSize: "11px", fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", marginBottom: "4px" }}>Advice</div>
                            <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5 }}>{e.managementPlan.nonPharmacologicalAdvice}</div>
                          </div>
                        )}

                        {e.managementPlan.followUpInstructions && (
                          <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f4f4f5" }}>
                            <div style={{ fontSize: "11px", fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", marginBottom: "4px" }}>Follow up</div>
                            <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5 }}>{e.managementPlan.followUpInstructions}</div>
                          </div>
                        )}

                        {e.managementPlan.counsellingNotes && (
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", marginBottom: "4px" }}>Counselling notes</div>
                            <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5 }}>{e.managementPlan.counsellingNotes}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
