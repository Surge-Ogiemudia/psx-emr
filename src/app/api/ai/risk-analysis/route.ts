import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { complaints, medications, conditions, allergies } = await req.json();

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
The patient presents with the following complaints:
${JSON.stringify(complaints, null, 2)}

Their medical background is:
Current Medications: ${JSON.stringify(medications)}
Chronic Conditions: ${JSON.stringify(conditions)}
Known Allergies: ${JSON.stringify(allergies)}

Analyze this information and return a highly concise risk analysis flagging any obvious connections (e.g. side effects of a medication causing the complaint, drug-disease interactions, or red flag symptoms). If there are no obvious risks, state that briefly.

Return ONLY a valid JSON string (not an object, just a string inside JSON quotes) containing your clinical insight paragraph. Do not include markdown blocks like \`\`\`json.
Example: "Patient's dry cough is a known side effect of Lisinopril."
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
          { error: `You're on free tier and quota has exceeded, please wait ${waitTime} to 'analyze clinical risk' or upgrade to pro version by contacting admin.` },
          { status: 429 }
        );
      }
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Failed to reach AI provider" }, { status: 500 });
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '""';
    
    textResult = textResult.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let analysis = "";
    try {
      analysis = JSON.parse(textResult);
    } catch (e) {
      analysis = textResult.replace(/^"|"$/g, ""); // strip quotes if parsing fails
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("AI Risk Analysis Error:", error);
    return NextResponse.json({ analysis: "Could not generate risk analysis at this time." });
  }
}
