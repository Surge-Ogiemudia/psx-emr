"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type {
  ComplaintSegment,
  DispensedMedicine,
  HpcAnswer,
  ReferralDetails,
  RosAnswerEntry,
} from "@/lib/types";

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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  treated: { label: "✓ Treated", cls: "status-treated" },
  referred: { label: "→ Referred", cls: "status-referred" },
  diagnostic: { label: "⏳ Pending", cls: "status-pending" },
};

export default function EncounterTimeline({ encounters }: { encounters: EncounterData[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (encounters.length === 0) {
    return <div className="empty-state">No encounters recorded yet.</div>;
  }

  return (
    <div className="timeline">
      {encounters.map((e) => {
        const isPending = e.status === "diagnostic_pending";
        const statusInfo = e.exitType
          ? STATUS_LABEL[e.exitType]
          : { label: "In progress", cls: "status-pending" };
        const segments = parseJson<ComplaintSegment[]>(
          e.complaint?.complaintSegments,
          [],
        );
        const complaintLabel =
          e.complaint?.gemmaSummary ??
          e.complaint?.textInput ??
          segments.map((s) => s.label).join(", ") ??
          "Encounter";
        const open = openId === e.id;

        return (
          <div className={`encounter-card ${isPending ? "pending" : ""}`} key={e.id}>
            <div className="ec-top" onClick={() => setOpenId(open ? null : e.id)}>
              <div>
                <div className="ec-date">{formatDateTime(e.encounterDate).toUpperCase()}</div>
                <div className="ec-complaint">{complaintLabel}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                  {e.staff.fullName}
                </div>
              </div>
              <span className={`ec-status ${statusInfo.cls}`}>{statusInfo.label}</span>
            </div>

            {isPending && (
              <Link href={`/encounter/${e.id}/resume`} className="continue-btn">
                Continue from diagnostics →
              </Link>
            )}

            {open && (
              <div className="encounter-detail">
                {e.hpcs.map((h, i) => {
                  const answers = parseJson<HpcAnswer[]>(h.answersGiven, []);
                  return (
                    <div className="detail-row" key={i}>
                      <span className="dr-label">HPC — {h.complaintSegment}</span>
                      {answers.map((a) => `${a.question} ${a.answer}`).join("; ") || "—"}
                    </div>
                  );
                })}

                {e.historySnapshot && (
                  <div className="detail-row">
                    <span className="dr-label">Vitals</span>
                    {[
                      e.historySnapshot.bloodPressure && `BP ${e.historySnapshot.bloodPressure}`,
                      e.historySnapshot.temperature && `Temp ${e.historySnapshot.temperature}°C`,
                      e.historySnapshot.bloodSugar && `Sugar ${e.historySnapshot.bloodSugar}`,
                      e.historySnapshot.pulse && `Pulse ${e.historySnapshot.pulse}bpm`,
                      e.historySnapshot.weight && `Weight ${e.historySnapshot.weight}kg`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "None recorded"}
                  </div>
                )}

                {e.ros && (
                  <div className="detail-row">
                    <span className="dr-label">Review of systems</span>
                    {parseJson<RosAnswerEntry[]>(e.ros.answersGiven, [])
                      .map((a) => `${a.question}: ${a.answer}`)
                      .join("; ") || "—"}
                  </div>
                )}

                {e.assessment && (
                  <div className="detail-row">
                    <span className="dr-label">Pharmaceutical assessment</span>
                    {e.assessment.pharmacistImpression}
                  </div>
                )}

                {e.managementPlan && (
                  <>
                    {e.managementPlan.exitType === "diagnostic" && (
                      <div className="detail-row">
                        <span className="dr-label">Diagnostics requested</span>
                        {parseJson<string[]>(e.managementPlan.diagnosticsRecommended, []).join(
                          ", ",
                        ) || "—"}
                      </div>
                    )}

                    {e.managementPlan.exitType === "referred" &&
                      e.managementPlan.referralDetails && (
                        <div className="detail-row">
                          <span className="dr-label">Referral</span>
                          {(() => {
                            const r = parseJson<ReferralDetails | null>(
                              e.managementPlan.referralDetails,
                              null,
                            );
                            return r
                              ? `${r.referredTo} — ${r.reason} (${r.urgency})`
                              : "—";
                          })()}
                        </div>
                      )}

                    {e.managementPlan.medicinesDispensed && (
                      <div className="detail-row">
                        <span className="dr-label">Medicines dispensed</span>
                        {parseJson<DispensedMedicine[]>(
                          e.managementPlan.medicinesDispensed,
                          [],
                        )
                          .map(
                            (m) =>
                              `${m.name} (${m.dose})${m.interim ? " — interim" : ""}`,
                          )
                          .join(", ") || "—"}
                      </div>
                    )}

                    {e.managementPlan.nonPharmacologicalAdvice && (
                      <div className="detail-row">
                        <span className="dr-label">Advice</span>
                        {e.managementPlan.nonPharmacologicalAdvice}
                      </div>
                    )}

                    {e.managementPlan.followUpInstructions && (
                      <div className="detail-row">
                        <span className="dr-label">Follow up</span>
                        {e.managementPlan.followUpInstructions}
                      </div>
                    )}

                    {e.managementPlan.counsellingNotes && (
                      <div className="detail-row">
                        <span className="dr-label">Counselling notes</span>
                        {e.managementPlan.counsellingNotes}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
