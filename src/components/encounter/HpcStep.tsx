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
        <div key={s.segment.label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="hpc-segment-label">
            {segIdx === 0 ? "🤕" : "🤧"} {s.segment.label}
          </div>
          {s.questions.map((q) => (
            <div className="hpc-question" key={q.question}>
              <div className="hpc-q-text">{q.question}</div>
              <div className="hpc-options">
                {q.options.map((opt) => (
                  <span
                    key={opt}
                    className={`hpc-option ${s.answers[q.question] === opt ? "selected" : ""}`}
                    onClick={() => selectAnswer(segIdx, q.question, opt)}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <textarea
            className="field"
            placeholder="Free text — anything else about this complaint…"
            value={s.freeText}
            onChange={(e) => setFreeText(segIdx, e.target.value)}
          />
        </div>
      ))}

      <button className="cta-btn" disabled={answeredCount === 0 || saving} onClick={continueToHistory}>
        {saving ? "Saving…" : "Continue"}
      </button>
    </>
  );
}
