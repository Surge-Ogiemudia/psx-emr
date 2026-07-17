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
      <Link href="/dispensary" className="fab-dispensary">
        💊 Dispensary
      </Link>
      <Link href="/encounter/new" className="fab-new-encounter">
        ＋ New Encounter
      </Link>
    </AppShell>
  );
}
