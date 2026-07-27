"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COMMON_DIAGNOSTICS = [
  "Malaria RDT",
  "Full Blood Count (FBC/CBC)",
  "Widal Test (Typhoid)",
  "Urinalysis & Microscopy",
  "Fasting Blood Glucose",
  "Lipid Profile",
  "Liver Function Test (LFT)",
  "Renal Function Test / Electrolytes",
  "Stool Microscopy & Culture",
  "Chest X-Ray",
  "Abdominal Ultrasound",
  "Electrocardiogram (ECG)"
];

export default function DiagnosticsStep({
  encounterId,
  tests: initialTests,
}: {
  encounterId: string;
  tests: string[];
}) {
  const router = useRouter();
  const [selectedTests, setSelectedTests] = useState<string[]>(initialTests || []);
  const [customTestInput, setCustomTestInput] = useState("");
  const [patientReturning, setPatientReturning] = useState<boolean | null>(null);
  const [interimTreatment, setInterimTreatment] = useState(false);
  const [closing, setClosing] = useState(false);

  function toggleTest(test: string) {
    if (selectedTests.includes(test)) {
      setSelectedTests(selectedTests.filter((t) => t !== test));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  }

  function addCustomTest() {
    if (!customTestInput.trim()) return;
    const val = customTestInput.trim();
    if (!selectedTests.includes(val)) {
      setSelectedTests([...selectedTests, val]);
    }
    setCustomTestInput("");
  }

  async function handleProceed() {
    setClosing(true);

    const payload = {
      exitType: "diagnostic",
      diagnosticsRecommended: selectedTests,
      patientReturning,
      interimTreatment,
    };

    try {
      await fetch(`/api/encounters/${encounterId}/management-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (interimTreatment) {
        router.push(`/encounter/${encounterId}/management/treat?interim=true`);
      } else {
        router.push(`/encounter/${encounterId}/done`);
      }
    } catch (e) {
      console.error(e);
      setClosing(false);
    }
  }

  return (
    <>
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🧪</span> Recommended Diagnostics & Laboratory Tests
        </div>
        <p style={{ fontSize: "12px", color: "#71717a", marginTop: 0, marginBottom: "16px" }}>
          Select common tests below or type a custom diagnostic order:
        </p>

        {/* Selected Chips */}
        {selectedTests.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase", marginBottom: "8px" }}>Selected Orders ({selectedTests.length}):</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {selectedTests.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0ea5e9",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => toggleTest(t)}
                    style={{ background: "none", border: "none", color: "white", fontWeight: 800, cursor: "pointer", padding: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Test Input */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            value={customTestInput}
            onChange={(e) => setCustomTestInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTest(); } }}
            placeholder="Type custom test name (e.g. Typhoid Antigen Test)..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #d4d4d8", fontSize: "14px" }}
          />
          <button
            type="button"
            onClick={addCustomTest}
            style={{ background: "#0ea5e9", color: "white", padding: "10px 16px", borderRadius: "8px", fontWeight: 700, border: "none", cursor: "pointer" }}
          >
            + Add
          </button>
        </div>

        {/* Quick Common Test Chips */}
        <div style={{ fontSize: "11px", fontWeight: 800, color: "#71717a", textTransform: "uppercase", marginBottom: "8px" }}>Quick Select Common Tests:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {COMMON_DIAGNOSTICS.map((test) => {
            const isSelected = selectedTests.includes(test);
            return (
              <button
                key={test}
                type="button"
                onClick={() => toggleTest(test)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: isSelected ? "1.5px solid #0ea5e9" : "1px solid #e4e4e7",
                  background: isSelected ? "#f0f9ff" : "#f8fafc",
                  color: isSelected ? "#0284c7" : "#334155",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {isSelected ? "✓ " : "+ "}{test}
              </button>
            );
          })}
        </div>
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
          background: (patientReturning !== null && selectedTests.length > 0) ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
          color: (patientReturning !== null && selectedTests.length > 0) ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
          cursor: (patientReturning !== null && selectedTests.length > 0) ? "pointer" : "not-allowed", boxShadow: (patientReturning !== null && selectedTests.length > 0) ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
          transition: "all 0.2s", opacity: closing ? 0.7 : 1
        }}
        disabled={patientReturning === null || selectedTests.length === 0 || closing}
        onClick={handleProceed}
      >
        {closing
          ? "Saving..."
          : interimTreatment
          ? "Proceed to prescribe →"
          : "End Session, Finish"}
      </button>
    </>
  );
}
