import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const logs = await prisma.auditLog.findMany({
    where: { recordType: "patient", recordId: id },
    orderBy: { changedAt: "desc" },
    include: { changedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({ logs });
}
