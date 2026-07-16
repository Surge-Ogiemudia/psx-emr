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
      <div className="card">
        <div className="card-title">🧪 Recommended Tests</div>
        {tests.length === 0 ? (
          <p className="empty-text">No diagnostics requested.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tests.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  background: "var(--surface)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Will patient return here with results?</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`pill-btn ${patientReturning === true ? "active" : ""}`}
            onClick={() => setPatientReturning(true)}
          >
            Yes
          </button>
          <button
            className={`pill-btn ${patientReturning === false ? "active" : ""}`}
            onClick={() => setPatientReturning(false)}
          >
            No
          </button>
        </div>
      </div>

      {patientReturning && (
        <div className="card">
          <div className="card-title">Provide interim treatment?</div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
            Symptomatic relief while awaiting test results.
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className={`pill-btn ${interimTreatment === true ? "active" : ""}`}
              onClick={() => setInterimTreatment(true)}
            >
              Yes, treat symptoms
            </button>
            <button
              className={`pill-btn ${interimTreatment === false ? "active" : ""}`}
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
            background: "var(--amber-light)",
            border: "1px solid var(--amber)",
            borderRadius: "12px",
            padding: "12px",
            fontSize: "13px",
            color: "var(--ink)",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--amber)", marginBottom: "4px" }}>
            Interim Treatment Note
          </div>
          You have selected to provide interim treatment. When you proceed, you will be directed to
          prescribe temporary symptom relief medicines before closing the encounter.
        </div>
      )}

      <button
        className="cta-btn"
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
