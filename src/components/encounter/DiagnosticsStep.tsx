"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MedicineSelector from "./MedicineSelector";
import { MOCK_DIAGNOSTIC_TESTS } from "@/lib/inventory";
import type { DispensedMedicine } from "@/lib/types";

export default function DiagnosticsStep({
  encounterId,
  patientId,
}: {
  encounterId: string;
  patientId: string;
}) {
  const router = useRouter();
  const [tests, setTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState("");
  const [patientReturning, setPatientReturning] = useState<boolean | null>(null);
  const [medicines, setMedicines] = useState<DispensedMedicine[]>([]);
  const [advice, setAdvice] = useState("");
  const [closing, setClosing] = useState(false);

  function toggleTest(test: string) {
    setTests((prev) => (prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]));
  }

  function addCustomTest() {
    if (!customTest.trim()) return;
    setTests((prev) => [...prev, customTest.trim()]);
    setCustomTest("");
  }

  async function closeEncounter() {
    if (patientReturning === null) return;
    setClosing(true);
    await fetch(`/api/encounters/${encounterId}/management-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exitType: "diagnostic",
        diagnosticsRecommended: tests,
        patientReturning,
        interimTreatment: medicines.length > 0,
        medicinesDispensed: medicines,
        nonPharmacologicalAdvice: advice || null,
      }),
    });
    router.push(patientReturning ? `/patients/${patientId}` : `/encounter/${encounterId}/done`);
  }

  return (
    <>
      <div className="card">
        <div className="card-title">🔬 Tests recommended</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {tests.map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--amber-light)",
                border: "1px solid var(--amber)",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--amber)" }}>🧪 {t}</span>
              <span style={{ fontSize: 10, color: "var(--amber)", cursor: "pointer" }} onClick={() => toggleTest(t)}>
                ✕
              </span>
            </div>
          ))}
        </div>
        <div className="hpc-options" style={{ marginBottom: 8 }}>
          {MOCK_DIAGNOSTIC_TESTS.filter((t) => !tests.includes(t)).map((t) => (
            <span key={t} className="hpc-option" onClick={() => toggleTest(t)}>
              + {t}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="field"
            placeholder="Custom test…"
            value={customTest}
            onChange={(e) => setCustomTest(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTest()}
          />
          <button className="cta-btn secondary" style={{ width: "auto", padding: "10px 16px" }} onClick={addCustomTest}>
            Add
          </button>
        </div>
      </div>

      <div style={{ background: "var(--amber-light)", border: "1.5px solid var(--amber)", borderRadius: 12, padding: "10px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--amber)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
          Will patient return with results?
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <div
            style={{
              background: patientReturning === true ? "var(--amber)" : "white",
              color: patientReturning === true ? "white" : "var(--amber)",
              fontSize: 11,
              fontWeight: 700,
              padding: "7px 14px",
              borderRadius: 8,
              flex: 1,
              textAlign: "center",
              border: "1px solid var(--amber)",
              cursor: "pointer",
            }}
            onClick={() => setPatientReturning(true)}
          >
            Yes — pause encounter
          </div>
          <div
            style={{
              background: patientReturning === false ? "var(--amber)" : "white",
              color: patientReturning === false ? "white" : "var(--amber)",
              fontSize: 11,
              fontWeight: 600,
              padding: "7px 14px",
              borderRadius: 8,
              flex: 1,
              textAlign: "center",
              border: "1px solid var(--amber)",
              cursor: "pointer",
            }}
            onClick={() => setPatientReturning(false)}
          >
            No — close here
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "var(--green-light)", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>
            💊 Interim treatment (while awaiting results)
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
            Optional — give something for symptoms now
          </div>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <MedicineSelector medicines={medicines} onChange={setMedicines} interim />
        </div>
      </div>

      <div className="card">
        <div className="card-title">📋 Interim advice</div>
        <textarea
          className="field"
          placeholder="Rest, fluids, avoid self-medicating with antibiotics until results are available…"
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
        />
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          ⚠ Record note
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.6 }}>
          Medicines given above are interim pending diagnostic confirmation. They will be clearly
          flagged in the patient record as pre-diagnosis treatment, not definitive therapy.
        </div>
      </div>

      <button
        className="cta-btn"
        disabled={tests.length === 0 || patientReturning === null || closing}
        onClick={closeEncounter}
      >
        {closing ? "Sending to POS…" : "Close encounter · Send to POS"}
      </button>
    </>
  );
}
