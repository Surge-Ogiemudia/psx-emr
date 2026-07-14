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
    where: { email: session.user.email },
  });
}
