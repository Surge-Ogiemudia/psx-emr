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
}: {
  encounterId: string;
  complaintSummary: string;
  patientAllergies: string;
}) {
  const router = useRouter();
  const allergies = parseJson<Allergy[]>(patientAllergies, []);
  const [impression, setImpression] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    suggestAssessment({
      complaintSummary,
      allergies: allergies.map((a) => a.substance),
    }).then(setSuggestion);
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

      <label className="field-label">Your impression</label>
      <textarea
        className="field complaint-full"
        style={{ color: "var(--ink)" }}
        placeholder="Pharmaceutical assessment — your clinical impression…"
        value={impression}
        onChange={(e) => setImpression(e.target.value)}
      />

      {suggestion && (
        <div className="gemma-suggestion">
          <div className="gemma-label">✦ Gemma suggestion</div>
          <div className="gemma-text">{suggestion}</div>
          <div className="gemma-actions">
            <span className="gemma-btn gemma-accept" onClick={acceptSuggestion}>
              Accept
            </span>
            <span className="gemma-btn gemma-ignore" onClick={() => setAccepted(false)}>
              Ignore
            </span>
          </div>
        </div>
      )}

      <button className="cta-btn" disabled={!impression.trim() || saving} onClick={continueToManagement}>
        {saving ? "Saving…" : "Continue to Management"}
      </button>
    </>
  );
}
