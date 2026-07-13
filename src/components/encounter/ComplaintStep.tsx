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

      <div className="complaint-grid">
        {INPUT_MODES.map((m) => (
          <div
            key={m.key}
            className={`complaint-btn ${activeModes.has(m.key) ? "active" : ""}`}
            onClick={() => (m.key === "voice" ? recordVoice() : toggleMode(m.key))}
          >
            <span className="cb-icon">{m.icon}</span>
            <span className="cb-label">
              {m.key === "voice" && recording ? "Recording…" : m.label}
            </span>
          </div>
        ))}
      </div>

      {activeModes.has("text") && (
        <textarea
          className="field complaint-full"
          placeholder="Type the complaint, or combine with voice/photo/file above…"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
      )}

      {voiceTranscript && (
        <div className="complaint-full">{voiceTranscript}</div>
      )}

      {activeModes.has("photo") && (
        <div className="field" style={{ textAlign: "center", color: "var(--muted)" }}>
          📷 Photo capture wires up to device camera — stubbed for now
        </div>
      )}
      {activeModes.has("file") && (
        <div className="field" style={{ textAlign: "center", color: "var(--muted)" }}>
          📎 File upload — stubbed for now
        </div>
      )}

      {processing && (
        <div className="ai-processing">
          <div className="ai-dot" />
          <span className="ai-text">Gemma is reading your input and segmenting complaints…</span>
        </div>
      )}

      {segments && !processing && (
        <div className="ai-processing">
          <div className="ai-dot" />
          <span className="ai-text">
            Identified {segments.length} complaint segment{segments.length !== 1 ? "s" : ""}:{" "}
            {segments.map((s) => s.label).join(", ")}
          </span>
        </div>
      )}

      <button className="cta-btn" disabled={!canContinue} onClick={continueToHpc}>
        {saving ? "Saving…" : "Continue to HPC"}
      </button>
    </>
  );
}
