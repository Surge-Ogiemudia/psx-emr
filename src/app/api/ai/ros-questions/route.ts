import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { complaintSummary } = await req.json();

    if (!complaintSummary) {
      return NextResponse.json({ error: "Complaint summary is required." }, { status: 400 });
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
You are an expert clinical pharmacist conducting a Review of Systems (ROS).
The patient has presented with the following chief complaint(s) and history:
"${complaintSummary}"

Generate exactly 5 to 7 short, direct questions to ask the patient to check for associated symptoms or red flags related to their complaint.
The questions MUST be answerable with a simple Yes, No, or Unsure.
Do not ask open-ended questions. Keep them very brief (under 6 words each if possible).
Example: "Fever or chills?", "Nausea or vomiting?", "Shortness of breath?".

Respond ONLY with a valid JSON array of strings, and nothing else. No markdown formatting.
["Question 1", "Question 2", "Question 3"]
`;

    const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=\${apiKey}\`, {
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
          { error: \`You're on free tier and quota has exceeded, please wait \${waitTime} to generate ROS questions or upgrade to pro version by contacting admin.\` },
          { status: 429 }
        );
      }
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Failed to reach AI provider" }, { status: 500 });
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    textResult = textResult.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    let questions = [];
    try {
      questions = JSON.parse(textResult);
    } catch (e) {
      console.error("Failed to parse ROS array:", textResult);
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("AI ROS generation error:", error);
    return NextResponse.json({ error: "Failed to generate ROS questions" }, { status: 500 });
  }
}
