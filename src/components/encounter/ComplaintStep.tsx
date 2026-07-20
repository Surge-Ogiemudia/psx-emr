"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AllergyBanner from "./AllergyBanner";
import { parseJson } from "@/lib/types";
import type { Allergy, ComplaintSegment } from "@/lib/types";
import { transcribeAudio, summarizeComplaint } from "@/lib/ai/client";

const INPUT_MODES = [
  { key: "voice", icon: "🎙️", label: "Voice" },
  { key: "photo", icon: "📷", label: "Photo" },
  { key: "file", icon: "📎", label: "File" },
  { key: "text", icon: "✏️", label: "Type" },
] as const;

type InputMode = (typeof INPUT_MODES)[number]["key"];

export default function ComplaintStep({
  encounterId,
  patientAllergies,
}: {
  encounterId: string;
  patientAllergies: string;
}) {
  const router = useRouter();
  const allergies = parseJson<Allergy[]>(patientAllergies, []);
  const [activeModes, setActiveModes] = useState<Set<InputMode>>(new Set(["text"]));
  const [textInput, setTextInput] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [segments, setSegments] = useState<ComplaintSegment[] | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleMode(mode: InputMode) {
    setActiveModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  }

  async function recordVoice() {
    setRecording(true);
    // TODO: capture from mic via MediaRecorder, pass real Blob to transcribeAudio.
    const transcript = await transcribeAudio(new Blob());
    setVoiceTranscript(transcript);
    setRecording(false);
  }

  async function continueToHpc() {
    setProcessing(true);
    const result = await summarizeComplaint({
      voiceTranscript,
      textInput,
      hasImages: activeModes.has("photo"),
      hasFiles: activeModes.has("file"),
    });
    setSegments(result.segments);

    setSaving(true);
    await fetch(`/api/encounters/${encounterId}/complaint`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voiceTranscript,
        textInput,
        gemmaSummary: result.summary,
        complaintSegments: result.segments,
      }),
    });
    router.push(`/encounter/${encounterId}/hpc`);
  }

  const combinedText = [voiceTranscript, textInput].filter(Boolean).join(" ");
  const canContinue = combinedText.trim().length > 0 && !processing && !saving;

  return (
    <>
      <AllergyBanner allergies={allergies} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {INPUT_MODES.map((m) => {
          const isActive = activeModes.has(m.key);
          return (
            <button
              key={m.key}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                padding: "16px 8px", borderRadius: "14px", border: "none", cursor: "pointer",
                background: isActive ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#f4f4f5",
                color: isActive ? "white" : "#52525b",
                boxShadow: isActive ? "0 8px 20px -4px rgba(79, 70, 229, 0.4)" : "none",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onClick={() => (m.key === "voice" ? recordVoice() : toggleMode(m.key))}
            >
              <span style={{ fontSize: "24px" }}>{m.icon}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {m.key === "voice" && recording ? "Recording…" : m.label}
              </span>
            </button>
          );
        })}
      </div>

      {activeModes.has("text") && (
        <textarea
          style={{
            width: "100%", minHeight: "140px", padding: "16px", borderRadius: "16px",
            border: "1px solid #e4e4e7", background: "#ffffff", fontSize: "15px", lineHeight: 1.6,
            color: "#18181b", outline: "none", resize: "vertical", marginBottom: "16px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
          }}
          onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
          onBlur={(e) => e.target.style.borderColor = "#e4e4e7"}
          placeholder="Type the complaint, or combine with voice/photo/file above…"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
      )}

      {voiceTranscript && (
        <div style={{ padding: "16px", background: "#f0fdfa", borderRadius: "16px", border: "1px solid #ccfbf1", color: "#0f766e", fontSize: "15px", lineHeight: 1.6, marginBottom: "16px" }}>
          <strong>🎙️ Transcript:</strong> {voiceTranscript}
        </div>
      )}

      {activeModes.has("photo") && (
        <div style={{ padding: "24px", textAlign: "center", background: "#f4f4f5", borderRadius: "16px", color: "#71717a", fontSize: "13px", fontWeight: 600, border: "1px dashed #d4d4d8", marginBottom: "16px" }}>
          📷 Photo capture wires up to device camera — stubbed for now
        </div>
      )}
      {activeModes.has("file") && (
        <div style={{ padding: "24px", textAlign: "center", background: "#f4f4f5", borderRadius: "16px", color: "#71717a", fontSize: "13px", fontWeight: 600, border: "1px dashed #d4d4d8", marginBottom: "16px" }}>
          📎 File upload — stubbed for now
        </div>
      )}

      {processing && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "linear-gradient(to right, #faf5ff, #f3e8ff)", borderRadius: "16px", color: "#7e22ce", marginBottom: "16px" }}>
          <div className="ai-dot" />
          <span style={{ fontSize: "13px", fontWeight: 600 }}>Gemma is reading your input and segmenting complaints…</span>
        </div>
      )}

      {segments && !processing && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "linear-gradient(to right, #f0fdf4, #dcfce7)", borderRadius: "16px", color: "#15803d", marginBottom: "16px" }}>
          <div className="ai-dot" style={{ animation: "none", background: "#22c55e" }} />
          <span style={{ fontSize: "13px", fontWeight: 600 }}>
            Identified {segments.length} complaint segment{segments.length !== 1 ? "s" : ""}:{" "}
            {segments.map((s) => s.label).join(", ")}
          </span>
        </div>
      )}

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: canContinue ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
        color: canContinue ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
        cursor: canContinue ? "pointer" : "not-allowed", boxShadow: canContinue ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
        transition: "all 0.2s", marginTop: "8px"
      }} disabled={!canContinue} onClick={continueToHpc}>
        {saving ? "Saving…" : "Continue to HPC"}
      </button>
    </>
  );
}
