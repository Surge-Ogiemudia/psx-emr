import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Check for OpenAI API Key if available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const apiFormData = new FormData();
      apiFormData.append("file", file);
      apiFormData.append("model", "whisper-1");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
        body: apiFormData,
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ text: data.text });
      }
    }

    // Fallback: return captured audio status
    return NextResponse.json({
      text: "",
      message: "Audio recorded successfully. Use the Dictate button to speak directly or type transcript notes."
    });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
