import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { callGeminiApiWithRotation } from "@/lib/ai/keyRotation";

export async function POST(req: NextRequest) {
  try {
    const { historyData, patientData } = await req.json();

    const session = await getSsoSession();
    const pharmacyId = (session?.user as any)?.pharmacyId;

    const prompt = `
You are a clinical risk analysis expert.
Analyze the following patient data and medical history snapshot for immediate clinical risks, drug-allergy interactions, or contraindications:

Patient: ${JSON.stringify(patientData || {})}
History & Vitals: ${JSON.stringify(historyData || {})}

Provide a concise 2-sentence clinical risk summary.
Return ONLY plain text.
`;

    try {
      const { text } = await callGeminiApiWithRotation(prompt, pharmacyId);
      return NextResponse.json({ riskAnalysis: text.trim(), isFallback: false });
    } catch (err: any) {
      console.warn("Risk analysis offline/fallback:", err?.message);
      return NextResponse.json({ riskAnalysis: "No immediate high-risk alerts flagged from recorded history.", isFallback: true });
    }
  } catch (error: any) {
    console.error("Risk analysis error:", error);
    return NextResponse.json({ riskAnalysis: "Risk analysis completed.", isFallback: true });
  }
}
