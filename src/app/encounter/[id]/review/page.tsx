"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import { formatDateTime } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type { ComplaintSegment, HpcAnswer, RosAnswerEntry, DispensedMedicine, ReferralDetails } from "@/lib/types";

export default function EncounterReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [encounter, setEncounter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [newAddendum, setNewAddendum] = useState("");
  const [isSubmittingAddendum, setIsSubmittingAddendum] = useState(false);

  useEffect(() => {
    fetch(`/api/encounters/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEncounter(data.encounter);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <TopBar title="Loading review..." backHref={`/`} backLabel="Back" />
        <div className="screen-content">Loading...</div>
      </AppShell>
    );
  }

  if (!encounter) {
    return (
      <AppShell>
        <TopBar title="Not found" backHref={`/`} backLabel="Back" />
        <div className="screen-content">Encounter not found.</div>
      </AppShell>
    );
  }

  const {
    patient,
    staff,
    complaint,
    hpcs,
    historySnapshot,
    ros,
    assessment,
    managementPlan,
  } = encounter;

  const addendums = parseJson<{ text: string; addedAt: string; staffName: string }[]>(encounter.addendums, []);

  async function handleAddAddendum() {
    if (!newAddendum.trim()) return;
    setIsSubmittingAddendum(true);
    try {
      const res = await fetch(`/api/encounters/${id}/addendum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newAddendum }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEncounter(updated.encounter);
        setNewAddendum("");
      }
    } catch (e) {
      console.error(e);
    }
    setIsSubmittingAddendum(false);
  }

  return (
    <AppShell>
      <TopBar 
        title="Encounter Review" 
        subtitle={`${patient.fullName} · ${formatDateTime(encounter.encounterDate)}`}
        backHref={`/patients/${patient.id}`} 
        backLabel="Patient Profile" 
      />
      <div className="screen-content" style={{ paddingBottom: 120 }}>
        
        {/* Document Header */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid #e4e4e7", marginBottom: 24, boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0F6E56", paddingBottom: 16, marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#18181b" }}>Clinical Encounter Record</h1>
              <div style={{ color: "#71717a", fontSize: 14, marginTop: 4 }}>ID: {encounter.id}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>{formatDateTime(encounter.encounterDate)}</div>
              <div style={{ fontSize: 13, color: "#71717a" }}>Attending: {staff.fullName}</div>
              <div style={{ fontSize: 13, color: "#71717a" }}>Status: {encounter.exitType?.toUpperCase() || "PENDING"}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 32 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase" }}>Patient</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#18181b" }}>{patient.fullName}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase" }}>Contact</div>
              <div style={{ fontSize: 15, color: "#18181b" }}>{patient.phoneNumber}</div>
            </div>
            {patient.gender && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase" }}>Gender</div>
                <div style={{ fontSize: 15, color: "#18181b", textTransform: "capitalize" }}>{patient.gender}</div>
              </div>
            )}
          </div>
        </div>

        {/* 1. Complaint */}
        {complaint && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              1. Chief Complaint
            </h2>
            <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid #e4e4e7" }}>
              {complaint.audioUrl && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 8 }}>Audio Recording</div>
                  <audio controls src={complaint.audioUrl} style={{ width: "100%", height: 40 }} />
                </div>
              )}
              {complaint.textInput && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Typed Notes</div>
                  <div style={{ fontSize: 15, color: "#18181b", lineHeight: 1.6 }}>{complaint.textInput}</div>
                </div>
              )}
              {complaint.gemmaSummary && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>AI Summary</div>
                  <div style={{ fontSize: 15, color: "#18181b", lineHeight: 1.6, background: "#f8fafc", padding: 12, borderRadius: 8, borderLeft: "4px solid #3b82f6" }}>
                    {complaint.gemmaSummary}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. HPC */}
        {hpcs && hpcs.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              2. History of Presenting Complaint
            </h2>
            <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", overflow: "hidden" }}>
              {hpcs.map((hpc: any, index: number) => {
                const answers = parseJson<HpcAnswer[]>(hpc.answersGiven, []);
                return (
                  <div key={hpc.id} style={{ padding: 20, borderBottom: index < hpcs.length - 1 ? "1px solid #e4e4e7" : "none" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#18181b", margin: "0 0 12px 0" }}>{hpc.complaintSegment}</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {answers.map((a, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 13, color: "#71717a", fontWeight: 600 }}>Q: {a.question}</div>
                          <div style={{ fontSize: 15, color: "#18181b", marginTop: 2 }}>A: {a.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. History & Vitals */}
        {historySnapshot && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              3. Vitals & Medical History
            </h2>
            <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid #e4e4e7" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {historySnapshot.bloodPressure && (
                  <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Blood Pressure</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}>{historySnapshot.bloodPressure}</div>
                  </div>
                )}
                {historySnapshot.temperature && (
                  <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Temperature</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}>{historySnapshot.temperature} °C</div>
                  </div>
                )}
                {historySnapshot.weight && (
                  <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Weight</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}>{historySnapshot.weight} kg</div>
                  </div>
                )}
                {historySnapshot.pulse && (
                  <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Pulse</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}>{historySnapshot.pulse} bpm</div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6 }}>
                <strong>Allergies:</strong> {parseJson<any[]>(historySnapshot.allergies, []).map(a => a.substance).join(", ") || "None recorded"}<br/>
                <strong>Conditions:</strong> {parseJson<string[]>(historySnapshot.conditions, []).join(", ") || "None recorded"}<br/>
                <strong>Medications:</strong> {parseJson<any[]>(historySnapshot.medications, []).map(m => `${m.name} (${m.dose})`).join(", ") || "None recorded"}
              </div>
            </div>
          </div>
        )}

        {/* 4. ROS */}
        {ros && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              4. Review of Systems
            </h2>
            <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid #e4e4e7" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {parseJson<RosAnswerEntry[]>(ros.answersGiven, []).map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, borderBottom: "1px solid #f4f4f5" }}>
                    <div style={{ fontSize: 14, color: "#18181b", paddingRight: 16 }}>{a.question}</div>
                    <div style={{ 
                      fontSize: 12, fontWeight: 800, padding: "4px 8px", borderRadius: 6, textTransform: "uppercase",
                      background: a.answer === "yes" ? "#fee2e2" : a.answer === "no" ? "#dcfce7" : "#f1f5f9",
                      color: a.answer === "yes" ? "#b91c1c" : a.answer === "no" ? "#15803d" : "#475569"
                    }}>
                      {a.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Assessment */}
        {assessment && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              5. Assessment
            </h2>
            <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid #e4e4e7" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Pharmacist Impression</div>
              <div style={{ fontSize: 15, color: "#18181b", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {assessment.pharmacistImpression}
              </div>
            </div>
          </div>
        )}

        {/* 6. Management Plan */}
        {managementPlan && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              6. Management Plan
            </h2>
            <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", overflow: "hidden" }}>
              
              {managementPlan.exitType === "treated" && (
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#8b5cf6", textTransform: "uppercase", marginBottom: 12 }}>Treatment Provided</div>
                  
                  {managementPlan.medicinesDispensed && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Medicines Dispensed</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {parseJson<DispensedMedicine[]>(managementPlan.medicinesDispensed, []).map((m, i) => (
                          <div key={i} style={{ background: "#f5f3ff", color: "#6d28d9", padding: "8px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                            {m.name} ({m.dose}) x {m.qty}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {managementPlan.counsellingNotes && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Counselling Notes</div>
                      <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 14, color: "#334155", borderLeft: "4px solid #94a3b8", whiteSpace: "pre-wrap" }}>
                        {managementPlan.counsellingNotes}
                      </div>
                    </div>
                  )}

                  {managementPlan.nonPharmacologicalAdvice && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Advice</div>
                      <div style={{ fontSize: 15, color: "#18181b" }}>{managementPlan.nonPharmacologicalAdvice}</div>
                    </div>
                  )}
                </div>
              )}

              {managementPlan.exitType === "referred" && (
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", marginBottom: 12 }}>Referral</div>
                  {(() => {
                    const r = parseJson<ReferralDetails | null>(managementPlan.referralDetails, null);
                    if (!r) return null;
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b" }}>Referred To</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#18181b" }}>{r.referredTo}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b" }}>Urgency</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: r.urgency === "Emergency" ? "#dc2626" : "#18181b" }}>{r.urgency}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Reason</div>
                        <div style={{ fontSize: 15, color: "#18181b" }}>{r.reason}</div>
                      </div>
                    );
                  })()}

                  {managementPlan.counsellingNotes && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Generated Referral Letter</div>
                      <div style={{ background: "#eef2ff", padding: 16, borderRadius: 8, fontSize: 14, color: "#312e81", border: "1px solid #c7d2fe", whiteSpace: "pre-wrap", fontFamily: "serif", lineHeight: 1.6 }}>
                        {managementPlan.counsellingNotes /* Note: AI referral letter was saved into counsellingNotes on refer endpoint */}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {managementPlan.exitType === "diagnostic" && (
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 12 }}>Diagnostics Requested</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {parseJson<string[]>(managementPlan.diagnosticsRecommended, []).map((d, i) => (
                      <div key={i} style={{ background: "#f0f9ff", color: "#0369a1", padding: "8px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Addendums */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            Addendums
          </h2>
          {addendums.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {addendums.map((add, idx) => (
                <div key={idx} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 15, color: "#92400e", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{add.text}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#b45309", fontWeight: 600 }}>
                    <span>{add.staffName}</span>
                    <span>{formatDateTime(add.addedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{ background: "#ffffff", borderRadius: 16, padding: 16, border: "1px solid #e4e4e7" }}>
            <textarea
              value={newAddendum}
              onChange={(e) => setNewAddendum(e.target.value)}
              placeholder="Type an addendum to append to this clinical record..."
              style={{ width: "100%", border: "none", outline: "none", resize: "none", minHeight: 80, fontSize: 15, fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button 
                onClick={handleAddAddendum}
                disabled={!newAddendum.trim() || isSubmittingAddendum}
                style={{ background: "#0F6E56", color: "white", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: newAddendum.trim() && !isSubmittingAddendum ? "pointer" : "not-allowed", opacity: newAddendum.trim() && !isSubmittingAddendum ? 1 : 0.5, border: "none" }}
              >
                {isSubmittingAddendum ? "Saving..." : "Save Addendum"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
