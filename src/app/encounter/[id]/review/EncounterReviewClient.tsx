"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type { ComplaintSegment, HpcAnswer, RosAnswerEntry, DispensedMedicine, ReferralDetails } from "@/lib/types";
import ShareEncounterModal from "@/components/patient/ShareEncounterModal";

export default function EncounterReviewClient({ initialEncounter }: { initialEncounter: any }) {
  const [encounter, setEncounter] = useState(initialEncounter);
  const [newAddendum, setNewAddendum] = useState("");
  const [isSubmittingAddendum, setIsSubmittingAddendum] = useState(false);

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
      const res = await fetch(`/api/encounters/${encounter.id}/addendum`, {
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

  function quickAddendumToSection(sectionTitle: string) {
    setNewAddendum((prev) => {
      const prefix = `[Section: ${sectionTitle}] `;
      return prev.startsWith(prefix) ? prev : `${prefix}${prev}`;
    });
    const el = document.getElementById("addendum-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  const [showShareModal, setShowShareModal] = useState(false);

  return (
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
            <div style={{ fontSize: 13, color: "#71717a" }}>Attending: {staff?.fullName || "Nil"}</div>
            <div style={{ fontSize: 13, color: "#71717a" }}>Status: {encounter.exitType?.toUpperCase() || "PENDING"}</div>
          </div>
        </div>

        {/* Action Buttons: PDF & Share */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #d4d4d8",
              background: "#ffffff",
              color: "#18181b",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📄 Download PDF / Print
          </button>
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#0F6E56",
              color: "white",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(15, 110, 86, 0.2)",
            }}
          >
            📤 Share Record with Patient
          </button>
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase" }}>Patient</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#18181b" }}>{patient?.fullName || "Nil"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase" }}>Contact</div>
            <div style={{ fontSize: 15, color: "#18181b" }}>{patient?.phoneNumber || "Nil"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase" }}>Gender</div>
            <div style={{ fontSize: 15, color: "#18181b", textTransform: "capitalize" }}>{patient?.gender || "Nil"}</div>
          </div>
        </div>
      </div>

      {/* 1. Complaint */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            1. Chief Complaint
          </h2>
          <button type="button" onClick={() => quickAddendumToSection("Chief Complaint")} style={{ background: "#E6F4F1", border: "none", color: "#0F6E56", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Section Addendum
          </button>
        </div>
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid #e4e4e7" }}>
          {!complaint ? (
            <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>
          ) : (
            <>
              {complaint.audioUrl ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 8 }}>Audio Recording</div>
                  <audio controls src={complaint.audioUrl} style={{ width: "100%", height: 40 }} />
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Audio Recording</div>
                  <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Typed Notes</div>
                <div style={{ fontSize: 15, color: complaint.textInput ? "#18181b" : "#71717a", lineHeight: 1.6 }}>{complaint.textInput || "Nil"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Complaint Summary</div>
                {complaint.gemmaSummary ? (
                  <div style={{ fontSize: 15, color: "#18181b", lineHeight: 1.6, background: "#f8fafc", padding: 12, borderRadius: 8, borderLeft: "4px solid #3b82f6" }}>
                    {complaint.gemmaSummary}
                  </div>
                ) : (
                  <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. HPC */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            2. History of Presenting Complaint
          </h2>
          <button type="button" onClick={() => quickAddendumToSection("HPC")} style={{ background: "#E6F4F1", border: "none", color: "#0F6E56", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Section Addendum
          </button>
        </div>
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", overflow: "hidden" }}>
          {/* Global HPC Audio Recording & Transcript */}
          {(encounter.hpcAudioUrl || encounter.hpcVoiceTranscript) && (
            <div style={{ padding: 20, borderBottom: "1px solid #e4e4e7", background: "#f8fafc" }}>
              {encounter.hpcAudioUrl && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 6 }}>HPC Audio Recording</div>
                  <audio controls src={encounter.hpcAudioUrl} style={{ width: "100%", height: 40 }} />
                </div>
              )}
              {encounter.hpcVoiceTranscript && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Voice Transcript</div>
                  <div style={{ fontSize: 14, color: "#18181b", fontStyle: "italic", background: "#ffffff", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    "{encounter.hpcVoiceTranscript}"
                  </div>
                </div>
              )}
            </div>
          )}

          {!hpcs || hpcs.length === 0 ? (
            <div style={{ padding: 20, fontSize: 15, color: "#71717a" }}>Nil</div>
          ) : (
            hpcs.map((hpc: any, index: number) => {
              const answers = parseJson<HpcAnswer[]>(hpc.answersGiven, []);
              return (
                <div key={hpc.id} style={{ padding: 20, borderBottom: index < hpcs.length - 1 ? "1px solid #e4e4e7" : "none" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#18181b", margin: "0 0 12px 0" }}>{hpc.complaintSegment || "Nil"}</h3>
                  {answers.length === 0 ? (
                    <div style={{ fontSize: 14, color: "#71717a" }}>Nil</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {answers.map((a, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 13, color: "#71717a", fontWeight: 600 }}>Q: {a.question}</div>
                          <div style={{ fontSize: 15, color: "#18181b", marginTop: 2 }}>A: {a.answer || "Nil"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {hpc.freeTextAdditions && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 13, color: "#71717a", fontWeight: 600 }}>Additional Notes</div>
                      <div style={{ fontSize: 15, color: "#18181b", marginTop: 2 }}>{hpc.freeTextAdditions}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. History & Vitals */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            3. Vitals & Medical History
          </h2>
          <button type="button" onClick={() => quickAddendumToSection("Vitals & History")} style={{ background: "#E6F4F1", border: "none", color: "#0F6E56", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Section Addendum
          </button>
        </div>
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid #e4e4e7" }}>
          {!historySnapshot ? (
            <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Blood Pressure</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: historySnapshot.bloodPressure ? "#18181b" : "#a1a1aa" }}>{historySnapshot.bloodPressure || "Nil"}</div>
                </div>
                <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Temperature</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: historySnapshot.temperature ? "#18181b" : "#a1a1aa" }}>{historySnapshot.temperature ? `${historySnapshot.temperature} °C` : "Nil"}</div>
                </div>
                <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Weight</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: historySnapshot.weight ? "#18181b" : "#a1a1aa" }}>{historySnapshot.weight ? `${historySnapshot.weight} kg` : "Nil"}</div>
                </div>
                <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Pulse</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: historySnapshot.pulse ? "#18181b" : "#a1a1aa" }}>{historySnapshot.pulse ? `${historySnapshot.pulse} bpm` : "Nil"}</div>
                </div>
                <div style={{ background: "#f4f4f5", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Blood Sugar</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: historySnapshot.bloodSugar ? "#18181b" : "#a1a1aa" }}>{historySnapshot.bloodSugar ? `${historySnapshot.bloodSugar} mg/dL` : "Nil"}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "#52525b", lineHeight: 1.8 }}>
                <strong>Age at visit:</strong> <span style={{ color: historySnapshot.ageAtVisit ? "#18181b" : "#a1a1aa" }}>{historySnapshot.ageAtVisit ?? "Nil"}</span><br/>
                <strong>Pregnancy Status:</strong> <span style={{ color: historySnapshot.isPregnant !== null ? "#18181b" : "#a1a1aa" }}>{historySnapshot.isPregnant === true ? "Pregnant" : historySnapshot.isPregnant === false ? "Not Pregnant" : "Nil"}</span><br/>
                <strong>Breastfeeding:</strong> <span style={{ color: historySnapshot.isBreastfeeding !== null ? "#18181b" : "#a1a1aa" }}>{historySnapshot.isBreastfeeding === true ? "Yes" : historySnapshot.isBreastfeeding === false ? "No" : "Nil"}</span><br/>
                <strong>Allergies:</strong> <span style={{ color: parseJson<any[]>(historySnapshot.allergies, []).length > 0 ? "#18181b" : "#a1a1aa" }}>{parseJson<any[]>(historySnapshot.allergies, []).map(a => a.substance).join(", ") || "Nil"}</span><br/>
                <strong>Conditions:</strong> <span style={{ color: parseJson<string[]>(historySnapshot.conditions, []).length > 0 ? "#18181b" : "#a1a1aa" }}>{parseJson<string[]>(historySnapshot.conditions, []).join(", ") || "Nil"}</span><br/>
                <strong>Medications:</strong> <span style={{ color: parseJson<any[]>(historySnapshot.medications, []).length > 0 ? "#18181b" : "#a1a1aa" }}>{parseJson<any[]>(historySnapshot.medications, []).map(m => `${m.name} (${m.dose})`).join(", ") || "Nil"}</span><br/>
                <strong>Social History:</strong> <span style={{ color: historySnapshot.socialHistory ? "#18181b" : "#a1a1aa" }}>{historySnapshot.socialHistory || "Nil"}</span><br/>
                <strong>Family History:</strong> <span style={{ color: historySnapshot.familyHistory ? "#18181b" : "#a1a1aa" }}>{historySnapshot.familyHistory || "Nil"}</span><br/>
                <strong>Surgical History:</strong> <span style={{ color: historySnapshot.surgicalHistory ? "#18181b" : "#a1a1aa" }}>{historySnapshot.surgicalHistory || "Nil"}</span><br/>
                <strong>Additional Notes:</strong> <span style={{ color: historySnapshot.additionalNotes ? "#18181b" : "#a1a1aa" }}>{historySnapshot.additionalNotes || "Nil"}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. ROS */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            4. Review of Systems
          </h2>
          <button type="button" onClick={() => quickAddendumToSection("ROS")} style={{ background: "#E6F4F1", border: "none", color: "#0F6E56", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Section Addendum
          </button>
        </div>
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid #e4e4e7" }}>
          {!ros || parseJson<RosAnswerEntry[]>(ros.answersGiven, []).length === 0 ? (
            <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {parseJson<RosAnswerEntry[]>(ros.answersGiven, []).map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, borderBottom: "1px solid #f4f4f5" }}>
                  <div style={{ fontSize: 14, color: "#18181b", paddingRight: 16 }}>{a.question}</div>
                  <div style={{ 
                    fontSize: 12, fontWeight: 800, padding: "4px 8px", borderRadius: 6, textTransform: "uppercase",
                    background: a.answer === "yes" ? "#fee2e2" : a.answer === "no" ? "#dcfce7" : "#f1f5f9",
                    color: a.answer === "yes" ? "#b91c1c" : a.answer === "no" ? "#15803d" : "#475569"
                  }}>
                    {a.answer || "Nil"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Assessment */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            5. Assessment
          </h2>
          <button type="button" onClick={() => quickAddendumToSection("Assessment")} style={{ background: "#E6F4F1", border: "none", color: "#0F6E56", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Section Addendum
          </button>
        </div>
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid #e4e4e7" }}>
          {!assessment ? (
            <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Pharmacist Impression</div>
              <div style={{ fontSize: 15, color: assessment.pharmacistImpression ? "#18181b" : "#a1a1aa", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 16 }}>
                {assessment.pharmacistImpression || "Nil"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Suggested Impression</div>
              <div style={{ fontSize: 15, color: assessment.gemmaSuggestion ? "#18181b" : "#a1a1aa", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {assessment.gemmaSuggestion || "Nil"}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 6. Management Plan */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            6. Management Plan
          </h2>
          <button type="button" onClick={() => quickAddendumToSection("Management Plan")} style={{ background: "#E6F4F1", border: "none", color: "#0F6E56", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Section Addendum
          </button>
        </div>
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", overflow: "hidden" }}>
          {!managementPlan ? (
            <div style={{ padding: 20, fontSize: 15, color: "#71717a" }}>Nil</div>
          ) : (
            <>
              {managementPlan.exitType === "treated" && (
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#8b5cf6", textTransform: "uppercase", marginBottom: 12 }}>Treatment Provided</div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Medicines Dispensed</div>
                    {(() => {
                      const meds = parseJson<DispensedMedicine[]>(managementPlan.medicinesDispensed, []);
                      if (meds.length === 0) return <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>;
                      return (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {meds.map((m, i) => (
                            <div key={i} style={{ background: "#f5f3ff", color: "#6d28d9", padding: "8px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                              {m.name} ({m.dose}) x {m.qty}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Counselling Notes</div>
                    {managementPlan.counsellingNotes ? (
                      <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 14, color: "#334155", borderLeft: "4px solid #94a3b8", whiteSpace: "pre-wrap" }}>
                        {managementPlan.counsellingNotes}
                      </div>
                    ) : (
                      <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Advice</div>
                    <div style={{ fontSize: 15, color: managementPlan.nonPharmacologicalAdvice ? "#18181b" : "#71717a" }}>
                      {managementPlan.nonPharmacologicalAdvice || "Nil"}
                    </div>
                  </div>
                </div>
              )}

              {managementPlan.exitType === "referred" && (
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#4338ca", textTransform: "uppercase", marginBottom: 12 }}>Referral</div>
                  {(() => {
                    const r = parseJson<ReferralDetails | null>(managementPlan.referralDetails, null);
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b" }}>Referred To</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: r?.referredTo ? "#18181b" : "#71717a" }}>{r?.referredTo || "Nil"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b" }}>Urgency</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: r?.urgency === "emergency" ? "#dc2626" : r?.urgency ? "#18181b" : "#71717a" }}>{r?.urgency || "Nil"}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Reason</div>
                        <div style={{ fontSize: 15, color: r?.reason ? "#18181b" : "#71717a" }}>{r?.reason || "Nil"}</div>
                      </div>
                    );
                  })()}

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#52525b", marginBottom: 4 }}>Generated Referral Letter</div>
                    {managementPlan.counsellingNotes ? (
                      <div style={{ background: "#eef2ff", padding: 16, borderRadius: 8, fontSize: 14, color: "#312e81", border: "1px solid #c7d2fe", whiteSpace: "pre-wrap", fontFamily: "serif", lineHeight: 1.6 }}>
                        {managementPlan.counsellingNotes}
                      </div>
                    ) : (
                      <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>
                    )}
                  </div>
                </div>
              )}

              {managementPlan.exitType === "diagnostic" && (
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 12 }}>Diagnostics Requested</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(() => {
                      const diags = parseJson<string[]>(managementPlan.diagnosticsRecommended, []);
                      if (diags.length === 0) return <div style={{ fontSize: 15, color: "#71717a" }}>Nil</div>;
                      return diags.map((d, i) => (
                        <div key={i} style={{ background: "#f0f9ff", color: "#0369a1", padding: "8px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                          {d}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 7. Addendums */}
      <div id="addendum-section" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F6E56", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          Addendums
        </h2>
        {addendums.length > 0 ? (
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
        ) : (
          <div style={{ fontSize: 15, color: "#71717a", marginBottom: 16 }}>Nil</div>
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

      <ShareEncounterModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        encounterId={encounter.id}
        patientName={patient?.fullName}
        patientPhone={patient?.phoneNumber}
      />
    </div>
  );
}
