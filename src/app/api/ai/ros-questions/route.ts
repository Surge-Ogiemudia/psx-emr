import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { callGeminiApiWithRotation } from "@/lib/ai/keyRotation";

const DEFAULT_ROS_QUESTIONS = [
  "Have you experienced any unexplained fever, chills, or night sweats recently?",
  "Have you noticed any shortness of breath or persistent chest discomfort?",
  "Have you experienced any dizziness, unusual fatigue, or weakness?",
  "Have you had any nausea, vomiting, or changes in bowel habits?",
  "Have you noticed any new skin rashes or unexplained joint swelling?"
];

export async function POST(req: NextRequest) {
  try {
    const { complaintSummary, hpcSegments } = await req.json();

    const session = await getSsoSession();
    const pharmacyId = (session?.user as any)?.pharmacyId;

    const prompt = `
You are an expert clinical pharmacist performing a Review of Systems (ROS).
Based on the patient's complaints: "${complaintSummary || ''}" and history: "${JSON.stringify(hpcSegments || [])}", 
generate 4 to 6 relevant red-flag or systemic screening questions to ask the patient.
Questions should be answerable with Yes, No, or Unsure.
Return ONLY a valid JSON array of question strings. Example:
[
  "Do you have a fever?",
  "Are you experiencing chest pain?"
]
`;

    try {
      const { text } = await callGeminiApiWithRotation(prompt, pharmacyId);
      let textResult = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const questions = JSON.parse(textResult);
      return NextResponse.json({ questions, isFallback: false });
    } catch (err: any) {
      console.warn("AI ROS Questions offline/fallback:", err?.message);
      return NextResponse.json({ questions: DEFAULT_ROS_QUESTIONS, isFallback: true });
    }
  } catch (error: any) {
    console.error("ROS generation error:", error);
    return NextResponse.json({ questions: DEFAULT_ROS_QUESTIONS, isFallback: true });
  }
}
