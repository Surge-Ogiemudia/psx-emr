"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateRosQuestions } from "@/lib/ai/client";
import type { RosAnswer } from "@/lib/enums";

export default function RosStep({
  encounterId,
  complaintSummary,
}: {
  encounterId: string;
  complaintSummary: string;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, RosAnswer>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    generateRosQuestions(complaintSummary).then(setQuestions);
  }, [complaintSummary]);

  async function continueToAssessment() {
    setSaving(true);
    await fetch(`/api/encounters/${encounterId}/ros`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionsGenerated: questions,
        answersGiven: Object.entries(answers).map(([question, answer]) => ({
          question,
          answer,
        })),
      }),
    });
    router.push(`/encounter/${encounterId}/assessment`);
  }

  if (!questions) {
    return (
      <div className="ai-processing">
        <div className="ai-dot" />
        <span className="ai-text">Gemma is preparing a short symptom checklist…</span>
      </div>
    );
  }

  const choices: RosAnswer[] = ["yes", "no", "unsure"];

  return (
    <>
      <div className="section-header">Associated symptoms — tap to answer</div>
      {questions.map((q) => (
        <div className="ros-row" key={q}>
          <span className="ros-q">{q}</span>
          <div className="ros-choices">
            {choices.map((c) => (
              <span
                key={c}
                className={`ros-choice ${answers[q] === c ? `selected-${c}` : ""}`}
                onClick={() => setAnswers((prev) => ({ ...prev, [q]: c }))}
              >
                {c === "yes" ? "Y" : c === "no" ? "N" : "?"}
              </span>
            ))}
          </div>
        </div>
      ))}

      <button
        className="cta-btn"
        disabled={Object.keys(answers).length === 0 || saving}
        onClick={continueToAssessment}
      >
        {saving ? "Saving…" : "Continue to Assessment"}
      </button>
    </>
  );
}
