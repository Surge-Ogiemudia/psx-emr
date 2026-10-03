import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import EncounterReviewClient from "./EncounterReviewClient";
import { formatDateTime } from "@/lib/format";

export default async function EncounterReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pharmacyId = await getTenantId();
  
  const encounter = /^[0-9a-fA-F]{24}$/.test(id)
    ? await prisma.encounter.findFirst({
    where: { id, pharmacyId },
    include: {
      patient: true,
      staff: { select: { fullName: true } },
      complaint: true,
      hpcs: true,
      historySnapshot: true,
      ros: true,
      assessment: true,
      managementPlan: true,
    },
  })
    : null;

  if (!encounter) {
    return (
      <AppShell>
        <TopBar title="Not found" backHref={`/`} backLabel="Back" />
        <div className="screen-content">Encounter not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar 
        title="Encounter Review" 
        subtitle={`${encounter.patient.fullName} · ${formatDateTime(encounter.encounterDate)}`}
        backHref={`/patients/${encounter.patient.id}`} 
        backLabel="Patient Profile" 
      />
      <EncounterReviewClient initialEncounter={encounter} />
    </AppShell>
  );
}
