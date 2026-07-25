import { prisma } from "@/lib/prisma";
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
  
  const encounter = await prisma.encounter.findUnique({
    where: { id },
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
  });

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
