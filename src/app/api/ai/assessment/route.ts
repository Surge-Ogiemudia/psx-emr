import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { callGeminiApiWithRotation } from "@/lib/ai/keyRotation";

export async function POST(req: NextRequest) {
  try {
    const { complaintSummary, allergies, hpcSegments, historySnapshot, ros } = await req.json();

    const session = await getSsoSession();
    const pharmacyId = (session?.user as any)?.pharmacyId;

    const prompt = `
You are an expert clinical pharmacist. The patient has presented for a consultation.
Here is the patient's complete clinical case so far:

1. Chief Complaints Summary: ${complaintSummary || 'None provided'}
2. History of Presenting Complaint (SOCRATES): ${JSON.stringify(hpcSegments || [])}
3. Known Allergies: ${allergies?.length ? allergies.join(", ") : "None reported"}
4. Medical Background: ${JSON.stringify(historySnapshot || {})}
5. Review of Systems Answers: ${JSON.stringify(ros?.answersGiven ? JSON.parse(ros.answersGiven) : [])}

Analyze this information and provide a single, concise paragraph containing:
1. Your differential diagnosis (what is the most likely issue based on symptoms).
2. Any immediate red flags or drug-disease interactions (especially considering their background and allergies).
3. A brief suggested treatment plan (e.g. recommend a specific class of drug, or refer to a doctor).

Do NOT use markdown. Return ONLY the plain text paragraph.
`;

    try {
      const { text } = await callGeminiApiWithRotation(prompt, pharmacyId);
      return NextResponse.json({ suggestion: text.trim(), isFallback: false });
    } catch (err: any) {
      console.warn("AI Assessment offline/fallback:", err?.message);
      const fallbackSuggestion = `Clinical Assessment: Symptom presentation (${complaintSummary || "recorded"}). Evaluate for appropriate OTC symptomatic management or physician referral if red flags emerge.`;
      return NextResponse.json({ suggestion: fallbackSuggestion, isFallback: true });
    }
  } catch (error: any) {
    console.error("AI Assessment generation error:", error);
    return NextResponse.json({ suggestion: "Clinical assessment recorded.", isFallback: true });
  }
}
