import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function getCurrentPharmacy() {
  const session = await auth();
  if (!session?.user) return null;
  
  const pharmacyId = (session.user as any).pharmacyId;
  if (!pharmacyId) return null;

  return prisma.pharmacy.findUnique({
    where: { id: pharmacyId },
  });
}

export async function getCurrentStaff(pharmacyId: string) {
  const session = await auth();
  if (!session?.user?.email) return null;

  return prisma.staff.findUnique({
    where: { phoneNumber: session.user.email },
  });
}

import { redirect } from "next/navigation";

export async function requireEmrAccess() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  // Block non-authorized staff roles from EMR
  if (["store_manager", "store_keeper", "staff"].includes(role)) {
    redirect("/login?error=AccessDenied");
  }

  return session;
}
