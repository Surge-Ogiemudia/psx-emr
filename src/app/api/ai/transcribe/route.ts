import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // 1. Get the current user's pharmacy to retrieve their API key
    const session = await getSsoSession();
    let apiKey = process.env.GEMINI_API_KEY; // Fallback to master key in .env

    if (session?.user && (session.user as any).pharmacyId) {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: (session.user as any).pharmacyId },
        select: { aiApiKey: true },
      });
      if (pharmacy?.aiApiKey) {
        apiKey = pharmacy.aiApiKey;
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        text: "",
        message: "No AI API key found. Please configure one in your Pharmacy settings or .env to enable transcription."
      });
    }

    // 2. Convert Audio File to Base64 for Gemini multimodal API
    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // 3. Send to Gemini for transcription
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.type || "audio/webm",
                  data: base64Audio
                }
              },
              {
                text: "Transcribe the following audio accurately. Only output the transcription, nothing else."
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return NextResponse.json({ error: "Transcription failed at AI provider" }, { status: 500 });
    }

    const data = await response.json();
    const transcribedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ text: transcribedText.trim() });

  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
