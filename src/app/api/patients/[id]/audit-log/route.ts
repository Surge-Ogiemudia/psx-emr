import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatientAccess } from "@/lib/access";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requirePatientAccess(id);
  if (access instanceof NextResponse) return access;

  const logs = await prisma.auditLog.findMany({
    where: { recordType: "patient", recordId: id },
    orderBy: { changedAt: "desc" },
    include: { changedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({ logs });
}
