import { getSsoSession } from "@/auth";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

export async function getCurrentPharmacy() {
  const session = await getSsoSession();
  if (!session?.user) return null;
  
  const pharmacyId = (session.user as any).pharmacyId;
  if (!pharmacyId) return null;

  return prisma.pharmacy.findUnique({
    where: { id: pharmacyId },
  });
}

export async function getCurrentStaff(pharmacyId: string) {
  const session = await getSsoSession();
  if (!session?.user?.email) return null;

  return prisma.staff.findUnique({
    where: { phoneNumber: session.user.email },
  });
}

export async function requireEmrAccess() {
  const session = await getSsoSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Only admin and emr_user can access EMR routes
  const user = session.user as any;
  if (user.role !== "admin" && user.role !== "emr_user") {
    redirect("/unauthorized"); // or wherever
  }
}

export async function getTenantId() {
  const session = await getSsoSession();
  
  const user = session?.user as any;
  if (!user?.pharmacyId) {
    redirect("/login");
  }
  
  return user.pharmacyId;
}

export async function requireSuperAdmin() {
  const session = await getSsoSession();
  
  const user = session?.user as any;
  if (!user || user.role !== "admin") {
    redirect("/login?error=AccessDenied");
  }
}
