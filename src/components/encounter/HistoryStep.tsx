"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseJson } from "@/lib/types";
import type { Allergy, Medication } from "@/lib/types";

export default function HistoryStep({
  encounterId,
  age,
  gender,
  conditions,
  medications,
  allergies,
}: {
  encounterId: string;
  age: number | null;
  gender: string | null;
  conditions: string;
  medications: string;
  allergies: string;
}) {
  const router = useRouter();
  const parsedConditions = parseJson<string[]>(conditions, []);
  const parsedMeds = parseJson<Medication[]>(medications, []);
  const parsedAllergies = parseJson<Allergy[]>(allergies, []);

  const [weight, setWeight] = useState("");
  const [bp, setBp] = useState("");
  const [temp, setTemp] = useState("");
  const [sugar, setSugar] = useState("");
  const [pulse, setPulse] = useState("");
  const [isPregnant, setIsPregnant] = useState<boolean | null>(null);
  const [isBreastfeeding, setIsBreastfeeding] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const isFemale = gender === "female";

  async function continueToRos() {
    setSaving(true);
    await fetch(`/api/encounters/${encounterId}/history`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ageAtVisit: age,
        gender,
        conditions: parsedConditions,
        medications: parsedMeds,
        allergies: parsedAllergies,
        weight: weight ? Number(weight) : null,
        bloodPressure: bp || null,
        temperature: temp ? Number(temp) : null,
        bloodSugar: sugar ? Number(sugar) : null,
        pulse: pulse ? Number(pulse) : null,
        isPregnant,
        isBreastfeeding,
      }),
    });
    router.push(`/encounter/${encounterId}/ros`);
  }

  return (
    <>
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>👤</span> Basic info
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Age</label>
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#f4f4f5", fontSize: "14px", color: "#52525b", fontWeight: 600 }}>{age ?? "—"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Gender</label>
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#f4f4f5", fontSize: "14px", color: "#52525b", fontWeight: 600 }}>{gender ?? "—"}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Weight (optional)</label>
          <input
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
            onBlur={(e) => e.target.style.borderColor = "#e4e4e7"}
            placeholder="e.g. 65 kg"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🩺</span> Vitals (taken today)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Blood pressure</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} onFocus={(e) => e.target.style.borderColor = "#0ea5e9"} onBlur={(e) => e.target.style.borderColor = "#e4e4e7"} placeholder="120/80 mmHg" value={bp} onChange={(e) => setBp(e.target.value)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Temperature</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} onFocus={(e) => e.target.style.borderColor = "#0ea5e9"} onBlur={(e) => e.target.style.borderColor = "#e4e4e7"} placeholder="°C" value={temp} onChange={(e) => setTemp(e.target.value)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Blood sugar</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} onFocus={(e) => e.target.style.borderColor = "#0ea5e9"} onBlur={(e) => e.target.style.borderColor = "#e4e4e7"} placeholder="mmol/L" value={sugar} onChange={(e) => setSugar(e.target.value)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Pulse</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} onFocus={(e) => e.target.style.borderColor = "#0ea5e9"} onBlur={(e) => e.target.style.borderColor = "#e4e4e7"} placeholder="bpm" value={pulse} onChange={(e) => setPulse(e.target.value)} />
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "#a1a1aa", marginTop: "12px", fontStyle: "italic" }}>
          Only fill what you measured. All vitals are optional.
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>📋</span> Known conditions
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {parsedConditions.map((c, i) => (
            <span key={i} style={{ background: "#f3f4f6", color: "#52525b", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>{c}</span>
          ))}
          {parsedAllergies.map((a, i) => (
            <span key={i} style={{ background: "#fee2e2", color: "#b91c1c", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700 }}>⚠ {a.substance} allergy</span>
          ))}
          {parsedConditions.length + parsedAllergies.length === 0 && (
            <span style={{ fontSize: "12px", color: "#a1a1aa", fontStyle: "italic" }}>None on file</span>
          )}
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>💊</span> Current medications
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {parsedMeds.map((m, i) => (
            <span key={i} style={{ background: "#e0f2fe", color: "#0369a1", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>{m.name} {m.dose}</span>
          ))}
          {parsedMeds.length === 0 && (
            <span style={{ fontSize: "12px", color: "#a1a1aa", fontStyle: "italic" }}>None on file</span>
          )}
        </div>
      </div>

      {isFemale && (
        <div style={{ background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", borderRadius: "16px", border: "1px solid #fecdd3", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(225, 29, 72, 0.05)" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#be123c", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>👩</span> Women-specific
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, transition: "all 0.2s", background: isPregnant ? "#be123c" : "#ffffff", color: isPregnant ? "white" : "#4c0519", boxShadow: isPregnant ? "0 4px 12px rgba(190, 18, 60, 0.2)" : "0 2px 4px rgba(0,0,0,0.02)" }}
              onClick={() => setIsPregnant(!isPregnant)}
            >
              {isPregnant ? "Pregnant" : "Not pregnant"}
            </button>
            <button
              style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, transition: "all 0.2s", background: isBreastfeeding ? "#be123c" : "#ffffff", color: isBreastfeeding ? "white" : "#4c0519", boxShadow: isBreastfeeding ? "0 4px 12px rgba(190, 18, 60, 0.2)" : "0 2px 4px rgba(0,0,0,0.02)" }}
              onClick={() => setIsBreastfeeding(!isBreastfeeding)}
            >
              {isBreastfeeding ? "Breastfeeding" : "Not breastfeeding"}
            </button>
          </div>
        </div>
      )}

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)",
        color: "white", fontSize: "15px", fontWeight: 700,
        cursor: "pointer", boxShadow: "0 8px 24px -4px rgba(79, 70, 229, 0.4)",
        transition: "all 0.2s", marginTop: "8px", opacity: saving ? 0.7 : 1
      }} disabled={saving} onClick={continueToRos}>
        {saving ? "Saving…" : "Continue to Review of Systems"}
      </button>
    </>
  );
}
