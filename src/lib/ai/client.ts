/**
 * On-device AI integration points.
 *
 * STUBBED FOR SCAFFOLD: every function below returns deterministic mock data
 * after a short artificial delay, so the encounter flow is fully clickable
 * end to end without a model download. Swap the body of each function for
 * a real call once model integration is validated on target hardware:
 *
 *   - transcribeAudio      -> transformers.js Whisper (tiny/base) ASR pipeline.
 *   - everything else      -> transformers.js Gemma 2B text-generation pipeline.
 *
 * Gemma is a text LLM, not an ASR model — transcription and generation are
 * intentionally two different model pipelines, both fully client-side.
 * Nothing here should ever make a network request with patient data.
 */

import type {
  ComplaintSegment,
  HpcQuestion,
  DispensedMedicine,
} from "@/lib/types";

const MOCK_DELAY_MS = 600;

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const res = await fetch("/api/ai/transcribe", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.text || "";
    } else if (res.status === 429) {
      const data = await res.json();
      throw new Error(data.error);
    }
  } catch (e) {
    console.warn("Audio transcription request failed:", e);
    throw e;
  }
  return "";
}

export interface ComplaintSummaryResult {
  summary: string;
  segments: ComplaintSegment[];
}

export async function summarizeComplaint(input: {
  voiceTranscript?: string;
  textInput?: string;
  hasImages: boolean;
  hasFiles: boolean;
}): Promise<ComplaintSummaryResult> {
  // TODO: run Gemma 2B via transformers.js against the combined multi-modal input.
  const raw = input.voiceTranscript || input.textInput || "";
  return delay({
    summary: raw || "Complaint captured — awaiting details.",
    segments: [
      { label: "Headache", summary: "Headache since this morning, whole head." },
      {
        label: "Runny nose + red eyes",
        summary: "Nasal discharge and bilateral eye redness, onset this morning.",
      },
    ],
  });
}

export async function generateHpcQuestions(
  segmentLabel: string,
): Promise<HpcQuestion[]> {
  // TODO: Gemma generates 5–7 SOCRATES-based MCQs per segment on device.
  return delay([
    {
      question: `How long have you had the ${segmentLabel.toLowerCase()}?`,
      options: ["Since this morning", "1–2 days", "3+ days", "Over a week"],
    },
    {
      question: "How severe is it, on balance?",
      options: ["Mild", "Moderate", "Severe"],
    },
    {
      question: "Has anything made it better or worse?",
      options: ["Rest helps", "Nothing helps", "Worse with activity", "Not sure"],
    },
  ]);
}

export async function generateRosQuestions(complaintSummary: string): Promise<string[]> {
  try {
    const res = await fetch("/api/ai/ros-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintSummary }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.questions && data.questions.length > 0) return data.questions;
    } else if (res.status === 429) {
      const errData = await res.json();
      console.warn("429 error:", errData.error);
    }
  } catch (e) {
    console.error(e);
  }

  // Universal 5 Fallback (if AI fails, returns empty, or hits 429)
  return [
    "Fever or chills?",
    "Nausea or vomiting?",
    "Shortness of breath?",
    "Severe fatigue or weakness?",
    "Unexplained pain?",
  ];
}

export async function suggestAssessment(context: {
  complaintSummary: string;
  allergies: string[];
}): Promise<string> {
  // TODO: Gemma drafts a pharmaceutical-assessment suggestion, allergy-aware.
  const allergyNote = context.allergies.length
    ? ` Avoid ${context.allergies.join(", ")} given allergy on file.`
    : "";
  return delay(
    `Likely viral upper respiratory tract infection based on symptom pattern.${allergyNote} Consider malaria exclusion if fever persists.`,
  );
}

export async function generateCounsellingNotes(
  medicines: DispensedMedicine[],
): Promise<string> {
  // TODO: Gemma drafts counselling notes from the dispensing record.
  if (medicines.length === 0) return "";
  return delay(
    medicines
      .map((m) => `${m.name}: take as directed — ${m.dose}. Review for side effects.`)
      .join(" "),
  );
}

export async function summarizeDiagnosticResult(
  _fileOrImage: File,
): Promise<string> {
  // TODO: Gemma reads an uploaded result (image/PDF) and summarizes findings.
  return delay(
    "Result uploaded. Summary pending pharmacist review — please confirm findings manually.",
  );
}
