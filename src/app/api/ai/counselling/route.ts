import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { medicines } = await req.json();

    if (!medicines || medicines.length === 0) {
      return NextResponse.json({ error: "No medicines provided." }, { status: 400 });
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

    const medsString = medicines
      .map((m: any) => `${m.drugName} ${m.strength || ""} - ${m.dosage} for ${m.duration}`)
      .join(", ");

    const prompt = `
You are an expert clinical pharmacist. The following medicines have just been prescribed/dispensed to a patient:
${medsString}

Write a concise set of patient-friendly counselling notes. Include:
1. How and when to take them (e.g. with or without food).
2. Key side effects to look out for.
3. Any important interactions or warnings (e.g. avoid alcohol).

Keep it brief, highly readable, and formatted as plain text (no markdown formatting like ** or bullet points, just use dashes if needed).
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
          { error: `You're on free tier and quota has exceeded, please wait ${waitTime} to generate counselling notes or upgrade to pro version by contacting admin.` },
          { status: 429 }
        );
      }
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Failed to reach AI provider" }, { status: 500 });
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No notes generated.';
    textResult = textResult.trim();

    return NextResponse.json({ notes: textResult });
  } catch (error: any) {
    console.error("AI Counselling generation error:", error);
    return NextResponse.json({ error: "Failed to generate counselling notes" }, { status: 500 });
  }
}
