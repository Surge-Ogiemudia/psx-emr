import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import PatientListClient from "@/components/patient/PatientListClient";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";

export default async function SearchPage() {
  const pharmacy = await getCurrentPharmacy();

  const patients = pharmacy
    ? await prisma.patient.findMany({
        where: { pharmacyId: pharmacy.id },
        orderBy: { fullName: "asc" },
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
      <TopBar title="Find a patient" subtitle="By name, phone, or face" />
      <div className="screen-content">
        <PatientListClient
          initialPatients={JSON.parse(JSON.stringify(patients))}
          autoFocusSearch
        />
      </div>
      <FooterDisclaimer />
      <BottomNav />
    </AppShell>
  );
}
