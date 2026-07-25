import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { complaintSummary, allergies, hpcSegments, historySnapshot, ros } = await req.json();

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
      return NextResponse.json({ error: "Gemini API key is missing." }, { status: 401 });
    }

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
          { error: `You're on free tier and quota has exceeded, please wait ${waitTime} to generate the clinical assessment or upgrade to pro version by contacting admin.` },
          { status: 429 }
        );
      }
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Failed to reach AI provider" }, { status: 500 });
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion generated.';
    
    // Clean up
    textResult = textResult.trim();

    return NextResponse.json({ suggestion: textResult });
  } catch (error: any) {
    console.error("AI Assessment generation error:", error);
    return NextResponse.json({ error: "Failed to generate AI assessment" }, { status: 500 });
  }
}
