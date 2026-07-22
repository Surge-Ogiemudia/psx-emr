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

  let staff = await prisma.staff.findUnique({
    where: { phoneNumber: session.user.email },
  });

  if (!staff && (session.user as any).role === 'admin') {
    // Auto-provision staff record for the admin
    staff = await prisma.staff.create({
      data: {
        id: session.user.id,
        pharmacyId: pharmacyId,
        fullName: session.user.name || "Admin",
        phoneNumber: session.user.email,
        role: "admin",
      },
    });
  }

  return staff;
}

export async function requireEmrAccess() {
  const session = await getSsoSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Allow admin, emr_user, pharmacist, and staff to access EMR routes
  const user = session.user as any;
  const allowedRoles = ["admin", "emr_user", "pharmacist", "doctor", "staff"];
  
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
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
