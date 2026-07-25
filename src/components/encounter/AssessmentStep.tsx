"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AllergyBanner from "./AllergyBanner";
import { suggestAssessment } from "@/lib/ai/client";
import { parseJson } from "@/lib/types";
import type { Allergy } from "@/lib/types";

export default function AssessmentStep({
  encounterId,
  complaintSummary,
  patientAllergies,
  hpcSegments,
  historySnapshot,
  ros,
  initialImpression,
}: {
  encounterId: string;
  complaintSummary: string;
  patientAllergies: string;
  hpcSegments: any[];
  historySnapshot: any;
  ros: any;
  initialImpression: string;
}) {
  const router = useRouter();
  const allergies = parseJson<Allergy[]>(patientAllergies, []);
  const [impression, setImpression] = useState(initialImpression);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    suggestAssessment({
      complaintSummary,
      allergies: allergies.map((a) => a.substance),
      hpcSegments,
      historySnapshot,
      ros,
    })
      .then((res) => {
        if (res.error) setSuggestionError(res.error);
        else setSuggestion(res.suggestion);
      })
      .catch((err) => {
        setSuggestionError(err.message || "Failed to generate AI suggestion");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function acceptSuggestion() {
    if (!suggestion) return;
    setImpression(suggestion);
    setAccepted(true);
  }

  async function continueToManagement() {
    setSaving(true);
    await fetch(`/api/encounters/${encounterId}/assessment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pharmacistImpression: impression,
        gemmaSuggestion: suggestion,
        suggestionAccepted: accepted,
      }),
    });
    router.push(`/encounter/${encounterId}/management`);
  }

  return (
    <>
      <AllergyBanner allergies={allergies} />

      <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: "8px", display: "block", paddingLeft: "4px" }}>
        Your impression
      </label>
      <textarea
        style={{
          width: "100%", minHeight: "160px", padding: "16px", borderRadius: "16px",
          border: "1px solid #e4e4e7", background: "#ffffff", fontSize: "15px", lineHeight: 1.6,
          color: "#18181b", outline: "none", resize: "vertical", marginBottom: "24px",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", transition: "border-color 0.2s"
        }}
        onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
        onBlur={(e) => e.target.style.borderColor = "#e4e4e7"}
        placeholder="Pharmaceutical assessment — your clinical impression…"
        value={impression}
        onChange={(e) => setImpression(e.target.value)}
      />

      {suggestionError && (
        <div style={{ background: "#fef2f2", borderRadius: "16px", border: "1px solid #fecaca", padding: "16px", marginBottom: "24px", color: "#dc2626", fontSize: "14px", fontWeight: 600 }}>
          ⚠️ {suggestionError}
        </div>
      )}

      {suggestion && !suggestionError && (
        <div style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderRadius: "16px", border: "1px solid #e9d5ff", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 20px -6px rgba(147, 51, 234, 0.15)" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#9333ea", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>✦</span> Gemma suggestion
          </div>
          <div style={{ fontSize: "15px", color: "#4c1d95", lineHeight: 1.6, marginBottom: "16px" }}>{suggestion}</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: "#9333ea", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(147, 51, 234, 0.3)" }} onClick={acceptSuggestion}>
              Accept
            </button>
            <button style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #d8b4fe", background: "transparent", color: "#7e22ce", fontSize: "13px", fontWeight: 700, cursor: "pointer" }} onClick={() => setAccepted(false)}>
              Ignore
            </button>
          </div>
        </div>
      )}

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: impression.trim() ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
        color: impression.trim() ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
        cursor: impression.trim() ? "pointer" : "not-allowed", boxShadow: impression.trim() ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
        transition: "all 0.2s", opacity: saving ? 0.7 : 1
      }} disabled={!impression.trim() || saving} onClick={continueToManagement}>
        {saving ? "Saving…" : "Continue to Management"}
      </button>
    </>
  );
}
