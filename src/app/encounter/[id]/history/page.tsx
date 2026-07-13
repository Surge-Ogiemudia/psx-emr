import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import StepProgress from "@/components/layout/StepProgress";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import HistoryStep from "@/components/encounter/HistoryStep";
import { getEncounterOrNotFound } from "@/lib/encounter-context";
import { ageFromDob } from "@/lib/format";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);
  const age = ageFromDob(encounter.patient.dateOfBirth);

  return (
    <AppShell>
      <TopBar
        title="Patient background"
        subtitle="Pre-filled for returning patients"
        backHref={`/encounter/${id}/hpc`}
        backLabel="HPC"
      />
      <StepProgress step={4} />
      <div className="screen-content">
        <HistoryStep
          encounterId={id}
          age={age}
          gender={encounter.patient.gender}
          conditions={encounter.patient.chronicConditions}
          medications={encounter.patient.currentMedications}
          allergies={encounter.patient.knownAllergies}
        />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
