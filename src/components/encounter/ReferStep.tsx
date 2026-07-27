"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REFERRAL_URGENCY, type ReferralUrgency } from "@/lib/enums";
import { generateReferralLetter } from "@/lib/ai/client";

export default function ReferStep({ encounterId, clinicalContext }: { encounterId: string, clinicalContext?: any }) {
  const router = useRouter();
  const [referredTo, setReferredTo] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<ReferralUrgency>("routine");
  
  const [referralLetter, setReferralLetter] = useState("");
  const [draftingLetter, setDraftingLetter] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);

  const [closing, setClosing] = useState(false);

  async function closeEncounter() {
    setClosing(true);
    await fetch(`/api/encounters/${encounterId}/management-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exitType: "referred",
        referralDetails: { referredTo, reason, urgency, referralLetter },
      }),
    });
    router.push(`/encounter/${encounterId}/done`);
  }

  async function handleDraftLetter() {
    if (!referredTo.trim() || !reason.trim()) return;
    setDraftingLetter(true);
    setLetterError(null);
    const res = await generateReferralLetter({
      referredTo,
      reason,
      urgency,
      ...clinicalContext
    });
    if (res.error) setLetterError(res.error);
    else if (res.letter) setReferralLetter(res.letter);
    setDraftingLetter(false);
  }

  const canClose = referredTo.trim() && reason.trim();

  return (
    <>
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>↗</span> Refer to
        </div>
        <input
          style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid #e4e4e7", background: "#f8fafc", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
          onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#ffffff"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.background = "#f8fafc"; }}
          placeholder="Physician, specialist, hospital, or facility name…"
          value={referredTo}
          onChange={(e) => setReferredTo(e.target.value)}
        />
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📝</span> Reason for referral
        </div>
        <textarea
          style={{ width: "100%", minHeight: "120px", padding: "16px", borderRadius: "12px", border: "1px solid #e4e4e7", background: "#f8fafc", fontSize: "14px", lineHeight: 1.5, color: "#18181b", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
          onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#ffffff"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.background = "#f8fafc"; }}
          placeholder="Why is this patient being referred?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>⏱</span> Urgency
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {REFERRAL_URGENCY.map((u) => {
            const isActive = urgency === u;
            return (
              <button
                key={u}
                style={{
                  flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer",
                  fontSize: "13px", fontWeight: 700, textTransform: "capitalize", transition: "all 0.2s",
                  background: isActive ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#f4f4f5",
                  color: isActive ? "white" : "#52525b",
                  boxShadow: isActive ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "none"
                }}
                onClick={() => setUrgency(u)}
              >
                {u}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderRadius: "16px", border: "1px solid #e9d5ff", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 20px -6px rgba(147, 51, 234, 0.15)" }}>
        <div style={{ fontSize: "12px", fontWeight: 800, color: "#9333ea", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>✦</span> Referral Letter
          </div>
          <button 
            onClick={handleDraftLetter}
            disabled={!canClose || draftingLetter}
            style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#9333ea", color: "white", fontSize: "11px", fontWeight: 700, cursor: (!canClose || draftingLetter) ? "not-allowed" : "pointer", opacity: (!canClose || draftingLetter) ? 0.5 : 1 }}
          >
            {draftingLetter ? "Drafting..." : "Draft with AI"}
          </button>
        </div>
        {letterError && (
          <div style={{ background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", padding: "16px", marginBottom: "16px", color: "#dc2626", fontSize: "14px", fontWeight: 600 }}>
            ⚠️ {letterError}
          </div>
        )}
        {draftingLetter ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#ffffff", borderRadius: "12px", color: "#7e22ce" }}>
            <div className="ai-dot" />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Drafting professional referral letter…</span>
          </div>
        ) : (!letterError && (
          <textarea
            style={{ width: "100%", minHeight: "180px", padding: "16px", borderRadius: "12px", border: "1px solid #d8b4fe", background: "#ffffff", fontSize: "14px", lineHeight: 1.5, color: "#4c1d95", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
            onFocus={(e) => { e.target.style.borderColor = "#a855f7"; e.target.style.boxShadow = "0 0 0 3px rgba(168, 85, 247, 0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#d8b4fe"; e.target.style.boxShadow = "none"; }}
            placeholder="Click 'Draft with AI' to automatically generate a formal referral letter using the patient's full clinical context."
            value={referralLetter}
            onChange={(e) => setReferralLetter(e.target.value)}
          />
        ))}
      </div>

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: canClose ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
        color: canClose ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
        cursor: canClose ? "pointer" : "not-allowed", boxShadow: canClose ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
        transition: "all 0.2s", opacity: closing ? 0.7 : 1
      }} disabled={!canClose || closing} onClick={closeEncounter}>
        {closing ? "Closing…" : "Close encounter · Generate referral note"}
      </button>
    </>
  );
}
