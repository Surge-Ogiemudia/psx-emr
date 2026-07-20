"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DiagnosticsStep({
  encounterId,
  tests,
}: {
  encounterId: string;
  tests: string[];
}) {
  const router = useRouter();
  const [patientReturning, setPatientReturning] = useState<boolean | null>(null);
  const [interimTreatment, setInterimTreatment] = useState(false);
  const [closing, setClosing] = useState(false);

  async function closeEncounter() {
    setClosing(true);

    const payload = {
      exitType: "diagnostic",
      diagnosticsRecommended: tests,
      patientReturning,
      interimTreatment,
    };

    const res = await fetch(`/api/encounters/${encounterId}/management-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    router.push(`/encounter/${encounterId}/done`);
  }

  return (
    <>
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🧪</span> Recommended Tests
        </div>
        {tests.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#71717a", fontStyle: "italic", textAlign: "center", padding: "12px" }}>No diagnostics requested.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tests.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
                  borderLeft: "3px solid #0ea5e9",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a"
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px" }}>Will patient return here with results?</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, transition: "all 0.2s", background: patientReturning === true ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#f4f4f5", color: patientReturning === true ? "white" : "#52525b", boxShadow: patientReturning === true ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "none" }}
            onClick={() => setPatientReturning(true)}
          >
            Yes
          </button>
          <button
            style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, transition: "all 0.2s", background: patientReturning === false ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#f4f4f5", color: patientReturning === false ? "white" : "#52525b", boxShadow: patientReturning === false ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "none" }}
            onClick={() => setPatientReturning(false)}
          >
            No
          </button>
        </div>
      </div>

      {patientReturning && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "4px" }}>Provide interim treatment?</div>
          <div style={{ fontSize: "12px", color: "#71717a", marginBottom: "16px" }}>
            Symptomatic relief while awaiting test results.
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, transition: "all 0.2s", background: interimTreatment === true ? "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)" : "#f4f4f5", color: interimTreatment === true ? "white" : "#52525b", boxShadow: interimTreatment === true ? "0 4px 12px rgba(234, 88, 12, 0.3)" : "none" }}
              onClick={() => setInterimTreatment(true)}
            >
              Yes, treat symptoms
            </button>
            <button
              style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, transition: "all 0.2s", background: interimTreatment === false ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#f4f4f5", color: interimTreatment === false ? "white" : "#52525b", boxShadow: interimTreatment === false ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "none" }}
              onClick={() => setInterimTreatment(false)}
            >
              No treatment yet
            </button>
          </div>
        </div>
      )}

      {interimTreatment && (
        <div
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "1px solid #fde68a",
            borderRadius: "16px",
            padding: "16px",
            fontSize: "13px",
            color: "#92400e",
            marginBottom: "24px",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.1)"
          }}
        >
          <div style={{ fontWeight: 800, color: "#d97706", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>⚠️</span> Interim Treatment Note
          </div>
          You have selected to provide interim treatment. When you proceed, you will be directed to
          prescribe temporary symptom relief medicines before closing the encounter.
        </div>
      )}

      <button
        style={{
          width: "100%", padding: "16px", borderRadius: "16px", border: "none",
          background: patientReturning !== null ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
          color: patientReturning !== null ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
          cursor: patientReturning !== null ? "pointer" : "not-allowed", boxShadow: patientReturning !== null ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
          transition: "all 0.2s", opacity: closing ? 0.7 : 1
        }}
        disabled={patientReturning === null || closing}
        onClick={
          interimTreatment
            ? () => router.push(`/encounter/${encounterId}/treat?interim=true`)
            : closeEncounter
        }
      >
        {interimTreatment
          ? "Proceed to prescribe"
          : closing
          ? "Ending session…"
          : "End Session, Finish"}
      </button>
    </>
  );
}
