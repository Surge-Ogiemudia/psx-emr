import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { voiceTranscript, textInput } = await req.json();

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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to reach AI provider" }, { status: 500 });
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Clean up potential markdown formatting
    textResult = textResult.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const segments = JSON.parse(textResult);

    return NextResponse.json({ segments });
  } catch (error) {
    console.error("AI Segmentation Error:", error);
    return NextResponse.json({ segments: [{ label: "Chief Complaint", summary: "Failed to segment." }] });
  }
}
