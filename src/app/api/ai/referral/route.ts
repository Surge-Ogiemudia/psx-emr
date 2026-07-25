import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { 
      referredTo, 
      reason, 
      urgency,
      complaintSummary,
      hpcSegments,
      historySnapshot,
      ros,
      pharmacistImpression
    } = await req.json();

    if (!referredTo || !reason) {
      return NextResponse.json({ error: "Referral destination and reason are required." }, { status: 400 });
    }

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
You are a clinical pharmacist writing a formal referral letter to a physician/hospital.
Here is the patient's case:

1. Chief Complaint: ${complaintSummary || 'None provided'}
2. History of Presenting Complaint: ${JSON.stringify(hpcSegments || [])}
3. Medical History: ${JSON.stringify(historySnapshot || {})}
4. Review of Systems: ${JSON.stringify(ros?.answersGiven ? JSON.parse(ros.answersGiven) : [])}
5. Pharmacist's Impression: ${pharmacistImpression || 'None provided'}

Referral Details:
- Referred To: ${referredTo}
- Urgency: ${urgency}
- Primary Reason for Referral: ${reason}

Draft a professional, concise referral letter. 
Address it to "${referredTo}". 
Start directly with "Dear ${referredTo}," or appropriate salutation.
Summarize the relevant clinical findings and the reason for referral.
Keep it under 250 words. Do NOT use markdown. Return ONLY the plain text letter.
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
          { error: `You're on free tier and quota has exceeded, please wait ${waitTime} to generate the referral letter or upgrade to pro version by contacting admin.` },
          { status: 429 }
        );
      }
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Failed to reach AI provider" }, { status: 500 });
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    textResult = textResult.trim();

    return NextResponse.json({ letter: textResult });
  } catch (error: any) {
    console.error("AI Referral generation error:", error);
    return NextResponse.json({ error: "Failed to generate referral letter" }, { status: 500 });
  }
}
