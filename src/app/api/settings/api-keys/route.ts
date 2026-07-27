import { NextRequest, NextResponse } from "next/server";
import { getSsoSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSsoSession();
    const pharmacyId = (session?.user as any)?.pharmacyId;

    if (!pharmacyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { aiApiKey: true },
    });

    return NextResponse.json({ 
      aiApiKey: pharmacy?.aiApiKey || "",
      hasEnvFallback: Boolean(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS)
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSsoSession();
    const pharmacyId = (session?.user as any)?.pharmacyId;

    if (!pharmacyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { aiApiKey } = await req.json();

    await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { aiApiKey: aiApiKey ? aiApiKey.trim() : null },
    });

    return NextResponse.json({ success: true, aiApiKey: aiApiKey ? aiApiKey.trim() : null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save API keys" }, { status: 500 });
  }
}
