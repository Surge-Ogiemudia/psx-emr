import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { callGeminiApiWithRotation } from "@/lib/ai/keyRotation";

export async function POST(req: NextRequest) {
  try {
    const { voiceTranscript, textInput } = await req.json();

    const session = await getSsoSession();
    const pharmacyId = (session?.user as any)?.pharmacyId;

    const prompt = `
You are an expert clinical pharmacist.
Read the following patient complaint notes and voice transcript.
Break down the rambling complaint into a strict JSON array of distinct medical problems.
Return ONLY valid JSON in this exact format:
[
  {
    "label": "Headache",
    "summary": "Brief summary of the headache symptoms"
  },
  {
    "label": "Rash",
    "summary": "Brief summary of the rash symptoms"
  }
]

Do not include markdown blocks like \`\`\`json. Just the array.
If the notes are empty or invalid, return a single generic "Chief Complaint" segment.

Voice Transcript:
${voiceTranscript || 'None'}

Pharmacist Notes:
${textInput || 'None'}
`;

    try {
      const { text } = await callGeminiApiWithRotation(prompt, pharmacyId);
      let textResult = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const segments = JSON.parse(textResult);
      return NextResponse.json({ segments });
    } catch (err: any) {
      console.warn("AI Segmentation offline/fallback:", err?.message);
      // Clean fallback without throwing error popups
      const fallbackLabel = textInput?.slice(0, 30) || "Chief Complaint";
      return NextResponse.json({
        segments: [{ label: fallbackLabel, summary: textInput || voiceTranscript || "Patient complaint recorded." }],
        isFallback: true
      });
    }
  } catch (error) {
    console.error("AI Segmentation Error:", error);
    return NextResponse.json({ segments: [{ label: "Chief Complaint", summary: "Patient complaint recorded." }] });
  }
}
