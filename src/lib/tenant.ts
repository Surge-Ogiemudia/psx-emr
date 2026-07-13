import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Resolves the current pharmacy from the request subdomain, e.g.
 * monak.emr.psx.ng -> subdomain "monak". Falls back to the first seeded
 * pharmacy for local dev (localhost has no subdomain to key off of).
 *
 * TODO: once real hosting is wired up, make the fallback fail closed
 * instead of defaulting to the first pharmacy.
 */
export async function getCurrentPharmacy() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const subdomain = host.split(".")[0];

  const bySubdomain = await prisma.pharmacy.findUnique({
    where: { subdomain },
  });
  if (bySubdomain) return bySubdomain;

  return prisma.pharmacy.findFirst({ orderBy: { createdAt: "asc" } });
}

/**
 * TODO: replace with real staff auth/session. For now returns the first
 * staff member seeded for the resolved pharmacy so every write has a
 * valid changedBy/staffId for the audit trail.
 */
export async function getCurrentStaff(pharmacyId: string) {
  return prisma.staff.findFirst({
    where: { pharmacyId },
    orderBy: { createdAt: "asc" },
  });
}
