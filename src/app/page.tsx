import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import Link from "next/link";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import PatientListClient from "@/components/patient/PatientListClient";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy, requireEmrAccess } from "@/lib/tenant";

export default async function HomePage() {
  await requireEmrAccess();
  const pharmacy = await getCurrentPharmacy();

  const patients = pharmacy
    ? await prisma.patient.findMany({
        where: { pharmacyId: pharmacy.id },
        orderBy: { lastVisitAt: "desc" },
        include: {
          encounters: {
            orderBy: { encounterDate: "desc" },
            take: 1,
            include: { complaint: true },
          },
        },
      })
    : [];

  return (
    <AppShell>
      <TopBar
        title={`${pharmacy?.name || "Pharmacy"} EMR`}
        subtitle={`${patients.length} patient records`}
      />
      <div className="screen-content">
        <PatientListClient initialPatients={JSON.parse(JSON.stringify(patients))} />
      </div>
      <FooterDisclaimer />
      
      <div style={{ position: "fixed", bottom: "max(24px, env(safe-area-inset-bottom))", right: "24px", display: "flex", flexDirection: "column", gap: "12px", zIndex: 50 }}>
        <Link href="/dispensary" style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: "14px",
          padding: "16px 24px",
          borderRadius: "32px",
          boxShadow: "0 8px 24px rgba(245, 158, 11, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          textDecoration: "none",
          transition: "transform 0.2s, box-shadow 0.2s"
        }}>
          💊 Dispensary
        </Link>
        <Link href="/encounter/new" style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: "14px",
          padding: "16px 24px",
          borderRadius: "32px",
          boxShadow: "0 8px 24px rgba(79, 70, 229, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          textDecoration: "none",
          transition: "transform 0.2s, box-shadow 0.2s"
        }}>
          ＋ New Encounter
        </Link>
      </div>
    </AppShell>
  );
}
