import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import ResumeStep from "@/components/encounter/ResumeStep";
import { getEncounterOrNotFound } from "@/lib/encounter-context";
import { parseJson } from "@/lib/types";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);
  const tests = parseJson<string[]>(
    encounter.managementPlan?.diagnosticsRecommended,
    [],
  );

  return (
    <AppShell>
      <TopBar
        title="Continue from diagnostics"
        subtitle={encounter.patient.fullName}
        backHref={`/patients/${encounter.patientId}`}
        backLabel="Patient record"
      />
      <div className="screen-content">
        <ResumeStep encounterId={id} testsRecommended={tests} />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
