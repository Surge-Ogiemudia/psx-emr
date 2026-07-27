import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { callGeminiApiWithRotation } from "@/lib/ai/keyRotation";

export async function POST(req: NextRequest) {
  try {
    const { medicines, complaintSummary, pharmacistImpression } = await req.json();

    const session = await getSsoSession();
    const pharmacyId = (session?.user as any)?.pharmacyId;

    const prompt = `
You are an expert clinical pharmacist. The patient is being dispensed the following medications:
${JSON.stringify(medicines || [])}

Context:
- Chief Complaint: ${complaintSummary || 'None'}
- Assessment: ${pharmacistImpression || 'None'}

Generate clear, patient-friendly counselling instructions for taking these medications.
Include:
1. Dosage and timing (e.g., with food, at bedtime).
2. Key precautions or common side effects to watch for.
3. Lifestyle or non-pharmacological advice relevant to the complaint.

Do NOT use markdown header tags like # or ##. Use bullet points or short paragraphs.
`;

    try {
      const { text } = await callGeminiApiWithRotation(prompt, pharmacyId);
      return NextResponse.json({ counselling: text.trim(), isFallback: false });
    } catch (err: any) {
      console.warn("AI Counselling offline/fallback:", err?.message);
      // Return null so the UI can vanish the section as requested by item #19
      return NextResponse.json({ counselling: null, isFallback: true });
    }
  } catch (error: any) {
    console.error("Counselling generation error:", error);
    return NextResponse.json({ counselling: null, isFallback: true });
  }
}
