import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { complaintSummary } = await req.json();

    if (!complaintSummary) {
      return NextResponse.json(
        { error: "Complaint summary is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean up potential markdown formatting
    if (text.startsWith("\`\`\`json")) text = text.replace("\`\`\`json", "");
    if (text.startsWith("\`\`\`")) text = text.replace("\`\`\`", "");
    if (text.endsWith("\`\`\`")) text = text.replace("\`\`\`", "");

    const questions = JSON.parse(text.trim());

    if (!Array.isArray(questions)) {
      throw new Error("Invalid output format from Gemini");
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("AI ROS generation error:", error);

    // Handle 429 quota limit errors gracefully
    if (error.status === 429) {
      return NextResponse.json(
        { error: "You're on free tier and quota has exceeded. Please wait a few seconds to generate ROS questions or upgrade to pro version by contacting admin." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate ROS questions" },
      { status: 500 }
    );
  }
}
