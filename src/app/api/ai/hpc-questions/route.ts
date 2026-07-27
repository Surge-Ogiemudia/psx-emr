import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { callGeminiApiWithRotation } from "@/lib/ai/keyRotation";

const DEFAULT_SOCRATES_QUESTIONS = [
  {
    question: "When did this symptom first start (Onset)?",
    options: ["Today", "1-2 days ago", "3-7 days ago", "More than a week ago"]
  },
  {
    question: "How severe is this issue currently?",
    options: ["Mild (barely noticeable)", "Moderate (interferes with activity)", "Severe (unbearable)"]
  },
  {
    question: "How would you describe the symptom pattern (Course)?",
    options: ["Constant/Continuous", "Comes and goes in waves", "Gradually worsening", "Improving"]
  },
  {
    question: "Are there any triggering or aggravating factors?",
    options: ["Food / Eating", "Physical exertion / Movement", "Stress", "None identified"]
  }
];

export async function POST(req: NextRequest) {
  try {
    const { segmentLabel } = await req.json();

    const session = await getSsoSession();
    const pharmacyId = (session?.user as any)?.pharmacyId;

    const prompt = `
You are an expert clinical pharmacist.
The patient has the following specific complaint: "${segmentLabel}".
Generate 3 to 4 highly targeted, clinical questions (like SOCRATES) to ask the patient to better diagnose this specific issue.
Return ONLY valid JSON in this exact format:
[
  {
    "question": "How long have you had the pain?",
    "options": ["Just started", "1-2 days", "3+ days", "Over a week"]
  },
  {
    "question": "How severe is it?",
    "options": ["Mild", "Moderate", "Severe"]
  }
]

Do not include markdown blocks like \`\`\`json. Just the array.
Ensure the questions are clinically relevant to "${segmentLabel}".
`;

    try {
      const { text } = await callGeminiApiWithRotation(prompt, pharmacyId);
      let textResult = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const questions = JSON.parse(textResult);
      return NextResponse.json({ questions, isFallback: false });
    } catch (err: any) {
      console.warn("AI HPC Questions offline/fallback:", err?.message);
      return NextResponse.json({ questions: DEFAULT_SOCRATES_QUESTIONS, isFallback: true });
    }
  } catch (error) {
    console.error("AI HPC Questions Error:", error);
    return NextResponse.json({ questions: DEFAULT_SOCRATES_QUESTIONS, isFallback: true });
  }
}
