"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateHpcQuestions } from "@/lib/ai/client";
import type { ComplaintSegment, HpcQuestion } from "@/lib/types";

interface SegmentState {
  segment: ComplaintSegment;
  questions: HpcQuestion[];
  answers: Record<string, string>;
  freeText: string;
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
          questions: await generateHpcQuestions(segment.label),
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
        <span className="ai-text">Gemma is generating questions for each complaint…</span>
      </div>
    );
  }

  const answeredCount = state.reduce((sum, s) => sum + Object.keys(s.answers).length, 0);

  return (
    <>
      {state.map((s, segIdx) => (
        <div key={s.segment.label} style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#18181b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "capitalize" }}>
            <span>{segIdx === 0 ? "🤕" : "🤧"}</span> {s.segment.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
            {s.questions.map((q) => (
              <div key={q.question} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#3f3f46" }}>{q.question}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {q.options.map((opt) => {
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
                  })}
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

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: answeredCount > 0 ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
        color: answeredCount > 0 ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
        cursor: answeredCount > 0 ? "pointer" : "not-allowed", boxShadow: answeredCount > 0 ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
        transition: "all 0.2s", opacity: saving ? 0.7 : 1
      }} disabled={answeredCount === 0 || saving} onClick={continueToHistory}>
        {saving ? "Saving…" : "Continue"}
      </button>
    </>
  );
}
