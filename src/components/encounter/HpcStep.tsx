"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComplaintSegment, HpcQuestion } from "@/lib/types";
import VoiceRecorder from "./VoiceRecorder";

interface SegmentState {
  segment: ComplaintSegment;
  questions: HpcQuestion[];
  answers: Record<string, string>;
  freeText: string;
}

async function fetchHpcQuestions(label: string): Promise<HpcQuestion[]> {
  try {
    const res = await fetch("/api/ai/hpc-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segmentLabel: label }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.questions && data.questions.length > 0) return data.questions;
    }
  } catch (e) {
    console.error(e);
  }
  
  // Guided SOCRATES Fallback (Non-AI fallback)
  return [
    { question: "Onset (When did it start?)", options: ["Today", "1-2 days ago", "3-7 days ago", "Over a week ago"] },
    { question: "Character & Severity (How bad is it?)", options: ["Mild", "Moderate", "Severe"] },
    { question: "Aggravating / Relieving Factors", options: ["Food/Eating", "Movement/Exercise", "Rest", "None identified"] },
  ];
}

export default function HpcStep({
  encounterId,
  segments: initialSegments,
  existingHpcs,
  existingAudioUrl,
  existingTranscript,
}: {
  encounterId: string;
  segments: ComplaintSegment[];
  existingHpcs?: any[];
  existingAudioUrl?: string | null;
  existingTranscript?: string | null;
}) {
  const router = useRouter();
  const [segments, setSegments] = useState<ComplaintSegment[]>(initialSegments);
  const [state, setState] = useState<SegmentState[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Manual 1-Question-Per-Screen Fallback Wizard State
  const [showManualWizard, setShowManualWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [complaintCount, setComplaintCount] = useState<number>(1);
  const [primaryComplaintText, setPrimaryComplaintText] = useState("");
  const [secondaryComplaints, setSecondaryComplaints] = useState<string[]>([""]);

  // Audio state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>(existingTranscript || "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. If we have existing HPCs from the DB, load them to persist state
      if (existingHpcs && existingHpcs.length > 0) {
        const loaded = existingHpcs.map((hpc: any) => ({
          segment: { label: hpc.complaintSegment, summary: "Loaded from previous session" },
          questions: JSON.parse(hpc.questionsGenerated || "[]"),
          answers: JSON.parse(hpc.answersGiven || "[]").reduce((acc: any, curr: any) => {
            acc[curr.question] = curr.answer;
            return acc;
          }, {}),
          freeText: hpc.freeTextAdditions || "",
        }));
        if (!cancelled) setState(loaded);
        return;
      }

      const activeSegments = segments.length > 0 ? segments : [{ label: "Chief Complaint", summary: "General complaint" }];

      // 2. Fetch questions
      const results = await Promise.all(
        activeSegments.map(async (segment) => ({
          segment,
          questions: await fetchHpcQuestions(segment.label),
          answers: {},
          freeText: "",
        })),
      );
      if (!cancelled) setState(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [segments, existingHpcs]);

  function selectAnswer(segIdx: number, question: string, answer: string) {
    setState((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const target = { ...next[segIdx] };
      target.answers = { ...target.answers, [question]: answer };
      next[segIdx] = target;
      return next;
    });
  }

  function setFreeText(segIdx: number, text: string) {
    setState((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[segIdx] = { ...next[segIdx], freeText: text };
      return next;
    });
  }

  function handleWizardSubmit() {
    const newSegs: ComplaintSegment[] = [];
    if (primaryComplaintText.trim()) {
      newSegs.push({ label: primaryComplaintText.trim(), summary: "Primary Complaint" });
    }
    secondaryComplaints.forEach((sc) => {
      if (sc.trim()) {
        newSegs.push({ label: sc.trim(), summary: "Secondary Complaint" });
      }
    });

    if (newSegs.length > 0) {
      setSegments(newSegs);
      setState(null); // Triggers reloading questions for new segments
    }
    setShowManualWizard(false);
  }

  async function handleNext() {
    if (!state) return;
    setSaving(true);
    setStatusMessage("Saving history of presenting complaint…");

    try {
      let finalAudioUrl = audioUrl;

      if (audioBlob) {
        const formData = new FormData();
        formData.append("file", audioBlob, "hpc_recording.webm");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAudioUrl = uploadData.url;
        }
      }

      await fetch(`/api/encounters/${encounterId}/hpc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hpcs: state.map((s) => ({
            complaintSegment: s.segment.label,
            questionsGenerated: s.questions,
            answersGiven: Object.entries(s.answers).map(([question, answer]) => ({
              question,
              answer,
            })),
            freeTextAdditions: s.freeText || undefined,
          })),
          segments: state.map((s) => ({
            complaintSegment: s.segment.label,
            questionsGenerated: s.questions,
            answersGiven: Object.entries(s.answers).map(([question, answer]) => ({
              question,
              answer,
            })),
            freeTextAdditions: s.freeText || undefined,
          })),
          hpcAudioUrl: finalAudioUrl || null,
          hpcVoiceTranscript: voiceTranscript || null,
        }),
      });
      router.push(`/encounter/${encounterId}/history`);
    } catch (e) {
      console.error(e);
      setSaving(false);
      setStatusMessage(null);
    }
  }

  if (!state) {
    return (
      <div className="ai-processing">
        <div className="ai-dot" />
        <span className="ai-text">Structuring targeted clinical questions…</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: "24px" }}>
        <VoiceRecorder
          onRecordingComplete={(blob, url, transcript) => {
            setAudioBlob(blob);
            setAudioUrl(url);
            setVoiceTranscript(transcript || "");
          }}
          onClear={() => {
            setAudioBlob(null);
            setAudioUrl(null);
            setVoiceTranscript("");
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>History of Presenting Complaint</h2>
        <button
          type="button"
          onClick={() => {
            setWizardStep(1);
            setShowManualWizard(true);
          }}
          style={{ background: "#f4f4f5", border: "1px solid #e4e4e7", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          + Add / Change Complaints
        </button>
      </div>

      {/* Manual 1-Question-Per-Screen Wizard Modal */}
      {showManualWizard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "480px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            
            {wizardStep === 1 && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0F6E56", textTransform: "uppercase", marginBottom: "4px" }}>Question 1 of 3</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: 0, marginBottom: "16px" }}>How many distinct complaints were identified?</h3>
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setComplaintCount(num)}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "10px",
                        border: complaintCount === num ? "2px solid #0F6E56" : "1px solid #e4e4e7",
                        background: complaintCount === num ? "#E6F4F1" : "#ffffff",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                    >
                      {num} {num === 4 ? "+" : ""}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button type="button" onClick={() => setShowManualWizard(false)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer" }}>Cancel</button>
                  <button type="button" onClick={() => setWizardStep(2)} style={{ padding: "8px 16px", background: "#0F6E56", color: "white", borderRadius: "8px", fontWeight: 700, border: "none", cursor: "pointer" }}>Next Step →</button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0F6E56", textTransform: "uppercase", marginBottom: "4px" }}>Question 2 of 3</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: 0, marginBottom: "12px" }}>What is the Primary Chief Complaint?</h3>
                <input
                  type="text"
                  value={primaryComplaintText}
                  onChange={(e) => setPrimaryComplaintText(e.target.value)}
                  placeholder="e.g. Severe throbbing headache"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d4d4d8", fontSize: "15px", marginBottom: "24px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button type="button" onClick={() => setWizardStep(1)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer" }}>← Back</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (complaintCount > 1) {
                        setWizardStep(3);
                      } else {
                        handleWizardSubmit();
                      }
                    }}
                    style={{ padding: "8px 16px", background: "#0F6E56", color: "white", borderRadius: "8px", fontWeight: 700, border: "none", cursor: "pointer" }}
                  >
                    {complaintCount > 1 ? "Next Step →" : "Done"}
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0F6E56", textTransform: "uppercase", marginBottom: "4px" }}>Question 3 of 3</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: 0, marginBottom: "12px" }}>Other Secondary Complaints</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                  {Array.from({ length: complaintCount - 1 }).map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={secondaryComplaints[idx] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSecondaryComplaints((prev) => {
                          const next = [...prev];
                          next[idx] = val;
                          return next;
                        });
                      }}
                      placeholder={`Secondary Complaint #${idx + 1} (e.g. Mild fever)`}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d4d4d8", fontSize: "14px" }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button type="button" onClick={() => setWizardStep(2)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer" }}>← Back</button>
                  <button type="button" onClick={handleWizardSubmit} style={{ padding: "8px 16px", background: "#0F6E56", color: "white", borderRadius: "8px", fontWeight: 700, border: "none", cursor: "pointer" }}>Done</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {state.map((s, segIdx) => (
        <div key={s.segment.label || segIdx} style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e4e4e7", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ background: "#E6F4F1", color: "#0F6E56", fontWeight: 800, padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}>
              Complaint #{segIdx + 1}
            </span>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#18181b" }}>{s.segment.label}</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {s.questions.map((q, qIdx) => (
              <div key={q.question || qIdx} style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "10px" }}>{q.question}</div>
                {q.options && q.options.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {q.options.map((opt) => {
                      const isSelected = s.answers[q.question] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => selectAnswer(segIdx, q.question, opt)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: isSelected ? "1.5px solid #0F6E56" : "1px solid #cbd5e1",
                            background: isSelected ? "#E6F4F1" : "#ffffff",
                            color: isSelected ? "#0F6E56" : "#475569",
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={s.answers[q.question] || ""}
                    onChange={(e) => selectAnswer(segIdx, q.question, e.target.value)}
                    placeholder="Type details..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                )}
              </div>
            ))}

            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>Additional Notes / Observations</div>
              <input
                type="text"
                value={s.freeText}
                onChange={(e) => setFreeText(segIdx, e.target.value)}
                placeholder="Any other notes regarding this complaint..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          style={{
            background: "#0F6E56",
            color: "white",
            padding: "12px 24px",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "15px",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? statusMessage || "Saving..." : "Continue to History & Vitals →"}
        </button>
      </div>
    </>
  );
}
