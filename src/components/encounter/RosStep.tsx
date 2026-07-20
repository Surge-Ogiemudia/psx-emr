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
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: "16px", paddingLeft: "4px" }}>
        Associated symptoms — tap to answer
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        {questions.map((q) => (
          <div key={q} style={{ 
            display: "flex", justifyContent: "space-between", alignItems: "center", 
            background: "#ffffff", padding: "12px 16px", borderRadius: "16px", 
            border: "1px solid #e4e4e7", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" 
          }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#18181b", flex: 1, paddingRight: "16px" }}>{q}</span>
            <div style={{ display: "flex", gap: "4px", background: "#f4f4f5", padding: "4px", borderRadius: "12px" }}>
              {choices.map((c) => {
                const isSelected = answers[q] === c;
                let bg = "transparent";
                let color = "#71717a";
                if (isSelected) {
                  if (c === "yes") { bg = "#fee2e2"; color = "#ef4444"; }
                  else if (c === "no") { bg = "#d1fae5"; color = "#10b981"; }
                  else { bg = "#e0e7ff"; color = "#6366f1"; }
                }
                
                return (
                  <button
                    key={c}
                    style={{
                      width: "36px", height: "36px", borderRadius: "8px", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: 800, transition: "all 0.2s",
                      background: isSelected ? bg : "transparent",
                      color: isSelected ? color : "#71717a",
                      boxShadow: isSelected ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                    }}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q]: c }))}
                  >
                    {c === "yes" ? "Y" : c === "no" ? "N" : "?"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        style={{
          width: "100%", padding: "16px", borderRadius: "16px", border: "none",
          background: Object.keys(answers).length > 0 ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
          color: Object.keys(answers).length > 0 ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
          cursor: Object.keys(answers).length > 0 ? "pointer" : "not-allowed", boxShadow: Object.keys(answers).length > 0 ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
          transition: "all 0.2s", opacity: saving ? 0.7 : 1
        }}
        disabled={Object.keys(answers).length === 0 || saving}
        onClick={continueToAssessment}
      >
        {saving ? "Saving…" : "Continue to Assessment"}
      </button>
    </>
  );
}
