import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { segmentLabel } = await req.json();

    const session = await getSsoSession();
    let apiKey = process.env.GEMINI_API_KEY;

    if (session?.user && (session.user as any).pharmacyId) {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: (session.user as any).pharmacyId },
        select: { aiApiKey: true },
      });
      if (pharmacy?.aiApiKey) apiKey = pharmacy.aiApiKey;
    }

    if (!apiKey) {
      return NextResponse.json({ error: "No API Key" }, { status: 401 });
    }

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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        let waitTime = "a few seconds";
        try {
          const errJson = JSON.parse(errText);
          const details = errJson?.error?.details || [];
          const retryInfo = details.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
          if (retryInfo?.retryDelay) waitTime = retryInfo.retryDelay;
        } catch (e) {}
        return NextResponse.json(
          { error: `You're on free tier and quota has exceeded, please wait ${waitTime} to 'generate questions' or upgrade to pro version by contacting admin.` },
          { status: 429 }
        );
      }
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Failed to reach AI provider" }, { status: 500 });
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Clean up potential markdown formatting
    textResult = textResult.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const questions = JSON.parse(textResult);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("AI HPC Questions Error:", error);
    return NextResponse.json({ questions: [] });
  }
}
