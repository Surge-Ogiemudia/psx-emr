import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import StepProgress from "@/components/layout/StepProgress";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import ComplaintStep from "@/components/encounter/ComplaintStep";
import { getEncounterOrNotFound } from "@/lib/encounter-context";
import { ageFromDob } from "@/lib/format";

export default async function ComplaintPage({
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
        title="What brings her/him in?"
        subtitle={`${encounter.patient.fullName} · ${encounter.patient.gender ?? "—"}${age ? ` · ${age}` : ""}`}
        backHref={`/encounter/new`}
        backLabel="Identification"
      />
      <StepProgress step={2} />
      <div className="screen-content">
        <ComplaintStep encounterId={encounter.id} patientAllergies={encounter.patient.knownAllergies} />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
