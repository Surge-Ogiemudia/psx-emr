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
      <div className="card" style={{ borderColor: "var(--green)", background: "var(--green-light)" }}>
        <div style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>🏥</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", textAlign: "center", marginBottom: 6 }}>
          Pharmaceutical Care Service
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
          This consultation is provided by a licensed pharmacist registered with the
          Pharmacists Council of Nigeria (PCN).
        </div>
      </div>

      <div className="card">
        <div className="card-title">What we can do</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Assess presenting complaints and take your medical history",
            "Recommend over-the-counter medicines for minor ailments",
            "Counsel you on medicines, dosage, and side effects",
            "Refer you to a physician when your condition requires it",
          ].map((t) => (
            <div key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "var(--green)", fontSize: 13, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 11, color: "var(--ink)", lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ background: "var(--surface)" }}>
        <div className="card-title">What we cannot do</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Diagnose medical conditions (Medical and Dental Practitioners Act)",
            "Prescribe prescription-only medicines without a valid physician prescription",
          ].map((t) => (
            <div key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "var(--red)", fontSize: 13, flexShrink: 0 }}>✗</span>
              <span style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <label
        style={{
          background: "white",
          border: "1.5px solid var(--green)",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: 2, width: 18, height: 18, accentColor: "var(--green)" }}
        />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", lineHeight: 1.5 }}>
            I consent to consultation and record keeping at this pharmacy.
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
            Your records are confidential and stored securely.{" "}
            <span
              style={{ color: "var(--green)", fontWeight: 600, textDecoration: "underline" }}
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
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 14,
            fontSize: 11,
            color: "var(--muted)",
            lineHeight: 1.7,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
            Legal Framework for Pharmacy Consultation
          </div>
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4, fontSize: 11 }}>
            1. Authority of the Pharmacist
          </div>
          <div style={{ marginBottom: 8 }}>
            Provided under PCN Act Cap P17 LFN 2004. Your pharmacist is licensed to conduct
            consultations, recommend OTC medicines, counsel patients, refer to physicians, and
            maintain confidential records.
          </div>
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4, fontSize: 11 }}>
            2. Scope and Limitations
          </div>
          <div style={{ marginBottom: 8 }}>
            This is a pharmaceutical care consultation, not a medical diagnosis. Pharmacists
            cannot diagnose under the Medical and Dental Practitioners Act Cap M8 LFN 2004 or
            prescribe prescription-only medicines without a valid prescription.
          </div>
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4, fontSize: 11 }}>
            3. Your Rights (National Health Act 2014)
          </div>
          <div style={{ marginBottom: 8 }}>
            Right to care without discrimination, to be informed, to confidentiality, to refuse
            treatment, to be referred, and to access your own records.
          </div>
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4, fontSize: 11 }}>
            4. Confidentiality
          </div>
          <div>
            Records stored securely. Not shared without consent except where required by law.
            PCN Good Pharmacy Practice Guidelines 2018 and National Health Act 2014 apply.
          </div>
        </div>
      )}

      <button className="cta-btn" disabled={!checked || starting} onClick={begin}>
        {starting ? "Starting…" : "Begin consultation"}
      </button>
    </div>
  );
}
