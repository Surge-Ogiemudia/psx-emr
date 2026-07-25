"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseJson } from "@/lib/types";
import type { Allergy, Medication } from "@/lib/types";
import VoiceRecorder from "./VoiceRecorder";

export default function HistoryStep({
  encounterId,
  age,
  gender,
  conditions,
  medications,
  allergies,
  existingSnapshot,
  complaintSegments,
}: {
  encounterId: string;
  age: number | null;
  gender: string | null;
  conditions: string;
  medications: string;
  allergies: string;
  existingSnapshot?: any;
  complaintSegments?: string;
  lastVisitAt: string;
}) {
  const router = useRouter();

  // Basic Info state
  const [currentAge, setCurrentAge] = useState<string>(existingSnapshot?.ageAtVisit?.toString() ?? age?.toString() ?? "");
  const [currentGender, setCurrentGender] = useState<string>(existingSnapshot?.gender ?? gender ?? "");

  // Conditions & Meds state
  const [condList, setCondList] = useState<string[]>(parseJson(existingSnapshot?.conditions || conditions, []));
  const [medList, setMedList] = useState<Medication[]>(parseJson(existingSnapshot?.medications || medications, []));
  const [allergyList, setAllergyList] = useState<Allergy[]>(parseJson(existingSnapshot?.allergies || allergies, []));

  // Vitals state
  const [weight, setWeight] = useState(existingSnapshot?.weight?.toString() ?? "");
  const [bp, setBp] = useState(existingSnapshot?.bloodPressure ?? "");
  const [temp, setTemp] = useState(existingSnapshot?.temperature?.toString() ?? "");
  const [sugar, setSugar] = useState(existingSnapshot?.bloodSugar?.toString() ?? "");
  const [pulse, setPulse] = useState(existingSnapshot?.pulse?.toString() ?? "");
  const [isPregnant, setIsPregnant] = useState<boolean | null>(existingSnapshot?.isPregnant ?? null);
  const [isBreastfeeding, setIsBreastfeeding] = useState<boolean | null>(existingSnapshot?.isBreastfeeding ?? null);

  // Extended History state
  const [socialHistory, setSocialHistory] = useState(existingSnapshot?.socialHistory ?? "");
  const [familyHistory, setFamilyHistory] = useState(existingSnapshot?.familyHistory ?? "");
  const [surgicalHistory, setSurgicalHistory] = useState(existingSnapshot?.surgicalHistory ?? "");
  const [additionalNotes, setAdditionalNotes] = useState(existingSnapshot?.additionalNotes ?? "");
  const [showExtended, setShowExtended] = useState(!!(existingSnapshot?.socialHistory || existingSnapshot?.familyHistory || existingSnapshot?.surgicalHistory || existingSnapshot?.additionalNotes));

  // Audio state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingSnapshot?.historyAudioUrl || null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>(existingSnapshot?.historyVoiceTranscript || "");

  // AI state
  const [aiRiskAnalysis, setAiRiskAnalysis] = useState<string | null>(existingSnapshot?.aiRiskAnalysis || null);
  const [analyzingRisk, setAnalyzingRisk] = useState(false);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isFemale = currentGender.toLowerCase() === "female";

  async function runAiRiskAnalysis() {
    setAnalyzingRisk(true);
    try {
      const res = await fetch("/api/ai/risk-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaints: parseJson(complaintSegments, []),
          medications: medList,
          conditions: condList,
          allergies: allergyList,
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiRiskAnalysis(data.analysis);
      }
    } catch (e) {
      console.error(e);
    }
    setAnalyzingRisk(false);
  }

  async function continueToRos() {
    setSaving(true);
    setStatusMessage("Saving patient history...");
    try {
      let finalAudioUrl = audioUrl;
      
      if (audioBlob) {
        setStatusMessage("Uploading history audio...");
        const res = await fetch('/api/upload?filename=history-audio.webm', {
          method: "POST",
          body: audioBlob,
        });
        if (res.ok) {
          const data = await res.json();
          finalAudioUrl = data.url;
        }
      }

      await fetch(`/api/encounters/${encounterId}/history`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageAtVisit: currentAge ? Number(currentAge) : null,
          gender: currentGender || null,
          conditions: condList,
          medications: medList,
          allergies: allergyList,
          
          socialHistory: socialHistory || null,
          familyHistory: familyHistory || null,
          surgicalHistory: surgicalHistory || null,
          additionalNotes: additionalNotes || null,
          historyAudioUrl: finalAudioUrl || null,
          historyVoiceTranscript: voiceTranscript || null,
          aiRiskAnalysis: aiRiskAnalysis || null,

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
    } catch (e) {
      console.error(e);
      setSaving(false);
      setStatusMessage(null);
    }
  }

  return (
    <>
      <div style={{ marginBottom: "24px" }}>
        <VoiceRecorder
          onRecordingComplete={(blob, url, transcript) => {
            setAudioBlob(blob);
            setAudioUrl(url);
            setVoiceTranscript(transcript);
          }}
          onClear={() => {
            setAudioBlob(null);
            setAudioUrl(null);
            setVoiceTranscript("");
          }}
          initialAudioUrl={existingSnapshot?.historyAudioUrl}
          initialTranscript={existingSnapshot?.historyVoiceTranscript}
        />
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>👤</span> Basic info (Synced to Profile)
          </div>
          <div style={{ fontSize: "11px", color: "#a1a1aa", fontStyle: "italic" }}>Last updated on {new Date(lastVisitAt).toLocaleDateString()}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Age</label>
            <input type="number" style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} placeholder="Years" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Gender</label>
            <select style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none", background: "white" }} value={currentGender} onChange={(e) => setCurrentGender(e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>📋</span> Medical History (Synced to Profile)
          </div>
          <div style={{ fontSize: "11px", color: "#a1a1aa", fontStyle: "italic" }}>Last updated on {new Date(lastVisitAt).toLocaleDateString()}</div>
        </div>
        
        {/* Conditions */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Chronic Conditions</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
            {condList.map((c, i) => (
              <span key={i} style={{ background: "#f3f4f6", color: "#52525b", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                {c}
                <button onClick={() => setCondList(condList.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="text" id="new-cond" placeholder="Add condition..." style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "13px", outline: "none" }} onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.trim();
                if (val) { setCondList([...condList, val]); e.currentTarget.value = ""; }
              }
            }} />
          </div>
        </div>

        {/* Medications */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Current Medications</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
            {medList.map((m, i) => (
              <span key={i} style={{ background: "#e0f2fe", color: "#0369a1", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                {m.name} {m.dose}
                <button onClick={() => setMedList(medList.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#7dd3fc", cursor: "pointer", padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="text" id="new-med-name" placeholder="Med name" style={{ flex: 2, padding: "8px 12px", borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "13px", outline: "none" }} />
            <input type="text" id="new-med-dose" placeholder="Dose (e.g. 10mg)" style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "13px", outline: "none" }} onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const name = (document.getElementById("new-med-name") as HTMLInputElement).value.trim();
                const dose = e.currentTarget.value.trim();
                if (name) { setMedList([...medList, { name, dose }]); (document.getElementById("new-med-name") as HTMLInputElement).value = ""; e.currentTarget.value = ""; }
              }
            }} />
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Allergies</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
            {allergyList.map((a, i) => (
              <span key={i} style={{ background: "#fee2e2", color: "#b91c1c", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                ⚠ {a.substance}
                <button onClick={() => setAllergyList(allergyList.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="text" id="new-allergy" placeholder="Add allergy substance..." style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "13px", outline: "none" }} onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.trim();
                if (val) { setAllergyList([...allergyList, { substance: val }]); e.currentTarget.value = ""; }
              }
            }} />
          </div>
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔍</span> AI Risk Analysis
          </div>
          <button onClick={runAiRiskAnalysis} disabled={analyzingRisk} style={{ padding: "6px 12px", borderRadius: "20px", background: "#fdf4ff", border: "1px solid #fae8ff", color: "#c026d3", fontSize: "12px", fontWeight: 700, cursor: analyzingRisk ? "not-allowed" : "pointer", opacity: analyzingRisk ? 0.7 : 1 }}>
            {analyzingRisk ? "Analyzing..." : "Check Interactions"}
          </button>
        </div>
        
        {aiRiskAnalysis && (
          <div style={{ marginTop: "12px", padding: "12px", background: "#fdf4ff", borderRadius: "10px", border: "1px solid #f5d0fe", fontSize: "14px", color: "#86198f", fontStyle: "italic", lineHeight: 1.5 }}>
            "{aiRiskAnalysis}"
          </div>
        )}
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <button onClick={() => setShowExtended(!showExtended)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px", fontWeight: 700, color: "#18181b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span>📂</span> Extended History</div>
          <span style={{ color: "#a1a1aa" }}>{showExtended ? "▼" : "▶"}</span>
        </button>
        
        {showExtended && (
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Social History (Smoking, Alcohol, Lifestyle)</label>
              <textarea style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "13px", outline: "none", minHeight: "60px", resize: "vertical" }} value={socialHistory} onChange={(e) => setSocialHistory(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Family History</label>
              <textarea style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "13px", outline: "none", minHeight: "60px", resize: "vertical" }} value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Surgical History</label>
              <textarea style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "13px", outline: "none", minHeight: "60px", resize: "vertical" }} value={surgicalHistory} onChange={(e) => setSurgicalHistory(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Additional Notes / Free Text</label>
              <textarea style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "13px", outline: "none", minHeight: "60px", resize: "vertical" }} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🩺</span> Vitals (taken today)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Weight (optional)</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} placeholder="e.g. 65 kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Blood pressure</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} placeholder="120/80 mmHg" value={bp} onChange={(e) => setBp(e.target.value)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Temperature</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} placeholder="°C" value={temp} onChange={(e) => setTemp(e.target.value)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Blood sugar</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} placeholder="mmol/L" value={sugar} onChange={(e) => setSugar(e.target.value)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Pulse</label>
            <input style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }} placeholder="bpm" value={pulse} onChange={(e) => setPulse(e.target.value)} />
          </div>
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

      {statusMessage && (
        <div style={{ textAlign: "center", color: "#0ea5e9", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>
          {statusMessage}
        </div>
      )}

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)",
        color: "white", fontSize: "15px", fontWeight: 700,
        cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 8px 24px -4px rgba(79, 70, 229, 0.4)",
        transition: "all 0.2s", opacity: saving ? 0.7 : 1
      }} disabled={saving} onClick={continueToRos}>
        {saving ? "Saving…" : "Continue to Review of Systems"}
      </button>
    </>
  );
}
