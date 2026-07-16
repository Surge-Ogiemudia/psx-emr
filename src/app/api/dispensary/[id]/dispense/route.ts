import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: encounterId } = await params;

    const plan = await prisma.managementPlan.update({
      where: { encounterId },
      data: { dispensaryFulfilled: true },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("Failed to mark as dispensed:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}
