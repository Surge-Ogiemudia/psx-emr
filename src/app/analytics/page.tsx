import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";

export default async function AnalyticsPage() {
  const pharmacy = await getCurrentPharmacy();

  if (!pharmacy) {
    return (
      <AppShell>
        <TopBar title="Analytics Dashboard" subtitle="Pharmacy Intelligence" />
        <div style={{ padding: 24, textAlign: "center" }}>Please log in to view analytics.</div>
      </AppShell>
    );
  }

  // Fetch summary analytics data across all encounters & patients
  const totalPatients = await prisma.patient.count({
    where: { pharmacyId: pharmacy.id },
  });

  const totalEncounters = await prisma.encounter.count({
    where: { pharmacyId: pharmacy.id },
  });

  const encounters = await prisma.encounter.findMany({
    where: { pharmacyId: pharmacy.id },
    select: {
      id: true,
      encounterDate: true,
      exitType: true,
      complaint: { select: { textInput: true, gemmaSummary: true } },
      historySnapshot: { select: { bloodPressure: true, temperature: true, weight: true } },
    },
    orderBy: { encounterDate: "desc" },
    take: 200,
  });

  // Aggregations
  let treatedCount = 0;
  let referredCount = 0;
  let diagnosticCount = 0;

  encounters.forEach((e) => {
    if (e.exitType === "treated") treatedCount++;
    else if (e.exitType === "referred") referredCount++;
    else if (e.exitType === "diagnostic") diagnosticCount++;
  });

  const analyticsData = {
    totalPatients,
    totalEncounters,
    treatedCount,
    referredCount,
    diagnosticCount,
    recentEncounters: JSON.parse(JSON.stringify(encounters)),
  };

  return (
    <AppShell>
      <TopBar title="Clinical Analytics & Intelligence" subtitle="System-wide Patient & Seasonal Trends" backHref="/" backLabel="Home" />
      <AnalyticsDashboardClient data={analyticsData} />
      <FooterDisclaimer />
    </AppShell>
  );
}
