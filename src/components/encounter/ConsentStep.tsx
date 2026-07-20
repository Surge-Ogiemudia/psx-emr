"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsentStep({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [starting, setStarting] = useState(false);

  async function begin() {
    setStarting(true);
    await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentGiven: true }),
    });
    const res = await fetch("/api/encounters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId }),
    });
    const data = await res.json();
    router.push(`/encounter/${data.encounter.id}/complaint`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", borderRadius: "16px", border: "1px solid #a7f3d0", padding: "24px", textAlign: "center", boxShadow: "0 8px 24px -4px rgba(16, 185, 129, 0.15)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, fontSize: "80px", opacity: 0.1, transform: "rotate(15deg)" }}>🏥</div>
        <div style={{ fontSize: "32px", marginBottom: "12px", position: "relative", zIndex: 1 }}>🏥</div>
        <div style={{ fontSize: "16px", fontWeight: 800, color: "#047857", marginBottom: "8px", position: "relative", zIndex: 1, letterSpacing: "-0.02em" }}>
          Pharmaceutical Care Service
        </div>
        <div style={{ fontSize: "13px", color: "#065f46", lineHeight: 1.6, position: "relative", zIndex: 1, fontWeight: 500 }}>
          This consultation is provided by a licensed pharmacist registered with the
          Pharmacists Council of Nigeria (PCN).
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "16px" }}>What we can do</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            "Assess presenting complaints and take your medical history",
            "Recommend over-the-counter medicines for minor ailments",
            "Counsel you on medicines, dosage, and side effects",
            "Refer you to a physician when your condition requires it",
          ].map((t) => (
            <div key={t} style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#f8fafc", padding: "12px", borderRadius: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", background: "#d1fae5", color: "#059669", borderRadius: "50%", fontSize: "12px", fontWeight: 800, flexShrink: 0, marginTop: "2px" }}>✓</span>
              <span style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #fee2e2", padding: "20px", boxShadow: "0 4px 20px -6px rgba(239, 68, 68, 0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "16px" }}>What we cannot do</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            "Diagnose medical conditions (Medical and Dental Practitioners Act)",
            "Prescribe prescription-only medicines without a valid physician prescription",
          ].map((t) => (
            <div key={t} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", background: "#fee2e2", color: "#dc2626", borderRadius: "50%", fontSize: "12px", fontWeight: 800, flexShrink: 0, marginTop: "2px" }}>✗</span>
              <span style={{ fontSize: "13px", color: "#71717a", lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <label
        style={{
          background: checked ? "#f0fdf4" : "#ffffff",
          border: checked ? "2px solid #10b981" : "2px solid #e4e4e7",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: checked ? "0 8px 24px -4px rgba(16, 185, 129, 0.2)" : "0 2px 8px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "6px", background: checked ? "#10b981" : "#f4f4f5", border: checked ? "none" : "1px solid #d4d4d8", transition: "all 0.2s", flexShrink: 0, marginTop: "2px" }}>
          {checked && <span style={{ color: "white", fontSize: "14px", fontWeight: 800 }}>✓</span>}
        </div>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ opacity: 0, position: "absolute", width: 0, height: 0 }}
        />
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: checked ? "#065f46" : "#18181b", lineHeight: 1.5, marginBottom: "6px" }}>
            I consent to consultation and record keeping at this pharmacy.
          </div>
          <div style={{ fontSize: "12px", color: checked ? "#047857" : "#71717a", lineHeight: 1.5 }}>
            Your records are confidential and stored securely.{" "}
            <span
              style={{ color: "#059669", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
              onClick={(e) => {
                e.preventDefault();
                setShowLegal((v) => !v);
              }}
            >
              Read full legal framework →
            </span>
          </div>
        </div>
      </label>

      {showLegal && (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            fontSize: "13px",
            color: "#475569",
            lineHeight: 1.7,
            maxHeight: "260px",
            overflowY: "auto",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>
            Legal Framework for Pharmacy Consultation
          </div>
          <div style={{ fontWeight: 700, color: "#334155", marginBottom: "4px", fontSize: "13px" }}>
            1. Authority of the Pharmacist
          </div>
          <div style={{ marginBottom: "12px" }}>
            Provided under PCN Act Cap P17 LFN 2004. Your pharmacist is licensed to conduct
            consultations, recommend OTC medicines, counsel patients, refer to physicians, and
            maintain confidential records.
          </div>
          <div style={{ fontWeight: 700, color: "#334155", marginBottom: "4px", fontSize: "13px" }}>
            2. Scope and Limitations
          </div>
          <div style={{ marginBottom: "12px" }}>
            This is a pharmaceutical care consultation, not a medical diagnosis. Pharmacists
            cannot diagnose under the Medical and Dental Practitioners Act Cap M8 LFN 2004 or
            prescribe prescription-only medicines without a valid prescription.
          </div>
          <div style={{ fontWeight: 700, color: "#334155", marginBottom: "4px", fontSize: "13px" }}>
            3. Your Rights (National Health Act 2014)
          </div>
          <div style={{ marginBottom: "12px" }}>
            Right to care without discrimination, to be informed, to confidentiality, to refuse
            treatment, to be referred, and to access your own records.
          </div>
          <div style={{ fontWeight: 700, color: "#334155", marginBottom: "4px", fontSize: "13px" }}>
            4. Confidentiality
          </div>
          <div>
            Records stored securely. Not shared without consent except where required by law.
            PCN Good Pharmacy Practice Guidelines 2018 and National Health Act 2014 apply.
          </div>
        </div>
      )}

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: checked ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#e4e4e7",
        color: checked ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 800,
        cursor: checked ? "pointer" : "not-allowed", boxShadow: checked ? "0 8px 24px -4px rgba(16, 185, 129, 0.4)" : "none",
        transition: "all 0.2s", opacity: starting ? 0.7 : 1, marginTop: "8px"
      }} disabled={!checked || starting} onClick={begin}>
        {starting ? "Starting…" : "Begin consultation"}
      </button>
    </div>
  );
}
