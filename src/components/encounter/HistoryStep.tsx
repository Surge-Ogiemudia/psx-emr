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
      <div className="card">
        <div className="card-title">👤 Basic info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="field-group">
            <label className="field-label">Age</label>
            <div className="field" style={{ background: "white" }}>{age ?? "—"}</div>
          </div>
          <div className="field-group">
            <label className="field-label">Gender</label>
            <div className="field" style={{ background: "white" }}>{gender ?? "—"}</div>
          </div>
        </div>
        <div className="field-group" style={{ marginTop: 4 }}>
          <label className="field-label">Weight (optional)</label>
          <input
            className="field"
            placeholder="e.g. 65 kg"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">🩺 Vitals (taken today)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="field-group">
            <label className="field-label">Blood pressure</label>
            <input className="field" placeholder="120/80 mmHg" value={bp} onChange={(e) => setBp(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Temperature</label>
            <input className="field" placeholder="°C" value={temp} onChange={(e) => setTemp(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Blood sugar</label>
            <input className="field" placeholder="mmol/L" value={sugar} onChange={(e) => setSugar(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Pulse</label>
            <input className="field" placeholder="bpm" value={pulse} onChange={(e) => setPulse(e.target.value)} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
          Only fill what you measured. All vitals are optional.
        </div>
      </div>

      <div className="card">
        <div className="card-title">📋 Known conditions</div>
        <div className="condition-tags">
          {parsedConditions.map((c, i) => (
            <span key={i} className="condition-tag tag-condition">{c}</span>
          ))}
          {parsedAllergies.map((a, i) => (
            <span key={i} className="condition-tag tag-allergy">⚠ {a.substance} allergy</span>
          ))}
          {parsedConditions.length + parsedAllergies.length === 0 && (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>None on file</span>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">💊 Current medications</div>
        <div className="condition-tags">
          {parsedMeds.map((m, i) => (
            <span key={i} className="condition-tag tag-med">{m.name} {m.dose}</span>
          ))}
          {parsedMeds.length === 0 && (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>None on file</span>
          )}
        </div>
      </div>

      {isFemale && (
        <div className="card" style={{ background: "#FFF8F5", borderColor: "#F5C4A8" }}>
          <div className="card-title" style={{ color: "var(--amber)" }}>👩 Women-specific</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              className="complaint-btn"
              style={{ flex: 1, padding: "8px 12px" }}
              onClick={() => setIsPregnant(!isPregnant)}
            >
              <span className="cb-label">{isPregnant ? "Pregnant" : "Not pregnant"}</span>
            </div>
            <div
              className="complaint-btn"
              style={{ flex: 1, padding: "8px 12px" }}
              onClick={() => setIsBreastfeeding(!isBreastfeeding)}
            >
              <span className="cb-label">{isBreastfeeding ? "Breastfeeding" : "Not breastfeeding"}</span>
            </div>
          </div>
        </div>
      )}

      <button className="cta-btn" disabled={saving} onClick={continueToRos}>
        {saving ? "Saving…" : "Continue to Review of Systems"}
      </button>
    </>
  );
}
