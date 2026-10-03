import { NextRequest, NextResponse } from "next/server";
import { requireEncounterAccess } from "@/lib/access";
import { isShareScope, signShareLink } from "@/lib/shareLink";

/** Creates a signed patient share link for one of the caller's own encounters. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encounterId } = await params;
  const access = await requireEncounterAccess(encounterId);
  if (access instanceof NextResponse) return access;

  const { scope } = await req.json();
  if (!isShareScope(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const sig = signShareLink(encounterId, scope);
  if (!sig) {
    return NextResponse.json({ error: "Share links are not configured" }, { status: 503 });
  }

  return NextResponse.json({
    path: `/share/encounter/${encounterId}?scope=${scope}&sig=${sig}`,
  });
}
