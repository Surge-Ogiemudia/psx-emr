"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComplaintSegment, HpcQuestion } from "@/lib/types";

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
  } catch (e) {}
  return [];
}

export default function HpcStep({
  encounterId,
  segments,
}: {
  encounterId: string;
  segments: ComplaintSegment[];
}) {
  const router = useRouter();
  const [state, setState] = useState<SegmentState[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        segments.map(async (segment) => ({
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
  }, [segments]);

  function selectAnswer(segIdx: number, question: string, answer: string) {
    setState((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[segIdx] = {
        ...next[segIdx],
        answers: { ...next[segIdx].answers, [question]: answer },
      };
      return next;
    });
  }

  function setFreeText(segIdx: number, value: string) {
    setState((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[segIdx] = { ...next[segIdx], freeText: value };
      return next;
    });
  }

  async function addSection() {
    const newLabel = prompt("Enter the new medical problem (e.g., 'Knee Pain'):");
    if (!newLabel || !newLabel.trim()) return;
    
    const newQuestions = await fetchHpcQuestions(newLabel.trim());
    setState((prev) => {
      if (!prev) return prev;
      return [...prev, {
        segment: { label: newLabel.trim(), summary: "Manually added by pharmacist" },
        questions: newQuestions,
        answers: {},
        freeText: "",
      }];
    });
  }

  function addQuestion(segIdx: number) {
    const newQ = prompt("Enter your specific question for the patient:");
    if (!newQ || !newQ.trim()) return;
    
    setState((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[segIdx] = {
        ...next[segIdx],
        questions: [...next[segIdx].questions, { question: newQ.trim(), options: [] }]
      };
      return next;
    });
  }

  async function continueToHistory() {
    if (!state) return;
    setSaving(true);
    await fetch(`/api/encounters/${encounterId}/hpc`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        state.map((s) => ({
          complaintSegment: s.segment.label,
          questionsGenerated: s.questions,
          answersGiven: Object.entries(s.answers).map(([question, answer]) => ({
            question,
            answer,
          })),
          freeTextAdditions: s.freeText || undefined,
        })),
      ),
    });
    router.push(`/encounter/${encounterId}/history`);
  }

  if (!state) {
    return (
      <div className="ai-processing">
        <div className="ai-dot" />
        <span className="ai-text">Gemini is analyzing the complaints and generating targeted questions…</span>
      </div>
    );
  }

  const answeredCount = state.reduce((sum, s) => sum + Object.keys(s.answers).length, 0);

  return (
    <>
      {state.map((s, segIdx) => (
        <div key={s.segment.label + segIdx} style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#18181b", display: "flex", alignItems: "center", gap: "8px", textTransform: "capitalize" }}>
              <span>{segIdx === 0 ? "🤕" : "🤧"}</span> {s.segment.label}
            </div>
            <button
              onClick={() => addQuestion(segIdx)}
              style={{
                padding: "6px 12px", borderRadius: "20px", background: "#f0fdfa", border: "1px solid #ccfbf1",
                color: "#0f766e", fontSize: "12px", fontWeight: 700, cursor: "pointer"
              }}
            >
              + Add Question
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
            {s.questions.map((q, qIdx) => (
              <div key={q.question + qIdx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#3f3f46" }}>{q.question}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {q.options && q.options.length > 0 ? (
                    q.options.map((opt) => {
                      const isSelected = s.answers[q.question] === opt;
                      return (
                        <button
                          key={opt}
                          style={{
                            padding: "8px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
                            fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
                            background: isSelected ? "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" : "#f4f4f5",
                            color: isSelected ? "white" : "#52525b",
                            boxShadow: isSelected ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none"
                          }}
                          onClick={() => selectAnswer(segIdx, q.question, opt)}
                        >
                          {opt}
                        </button>
                      );
                    })
                  ) : (
                    <input
                      type="text"
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7",
                        fontSize: "14px", outline: "none", color: "#18181b"
                      }}
                      placeholder="Type patient's answer..."
                      value={s.answers[q.question] || ""}
                      onChange={(e) => selectAnswer(segIdx, q.question, e.target.value)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <textarea
            style={{
              width: "100%", minHeight: "80px", padding: "12px 16px", borderRadius: "12px",
              border: "1px solid #e4e4e7", background: "#f8fafc", fontSize: "14px", lineHeight: 1.5,
              color: "#18181b", outline: "none", resize: "vertical", transition: "border-color 0.2s"
            }}
            onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#ffffff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.background = "#f8fafc"; }}
            placeholder="Free text — anything else about this complaint…"
            value={s.freeText}
            onChange={(e) => setFreeText(segIdx, e.target.value)}
          />
        </div>
      ))}

      <button
        onClick={addSection}
        style={{
          width: "100%", padding: "14px", borderRadius: "16px", background: "transparent",
          border: "2px dashed #d4d4d8", color: "#52525b", fontSize: "14px", fontWeight: 700,
          cursor: "pointer", marginBottom: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
        }}
      >
        <span>➕</span> Add New Complaint Section
      </button>

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)",
        color: "white", fontSize: "15px", fontWeight: 700,
        cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 8px 24px -4px rgba(79, 70, 229, 0.4)",
        transition: "all 0.2s", opacity: saving ? 0.7 : 1
      }} disabled={saving} onClick={continueToHistory}>
        {saving ? "Saving…" : "Continue"}
      </button>
    </>
  );
}
