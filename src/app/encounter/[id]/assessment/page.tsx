import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import StepProgress from "@/components/layout/StepProgress";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import AssessmentStep from "@/components/encounter/AssessmentStep";
import { getEncounterOrNotFound } from "@/lib/encounter-context";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);

  return (
    <AppShell>
      <TopBar
        title="Assessment"
        subtitle="Your clinical impression"
        backHref={`/encounter/${id}/ros`}
        backLabel="Review of Systems"
      />
      <StepProgress step={6} />
      <div className="screen-content">
        <AssessmentStep
          encounterId={id}
          complaintSummary={encounter.complaint?.gemmaSummary ?? encounter.complaint?.textInput ?? ""}
          patientAllergies={encounter.patient.knownAllergies}
          hpcSegments={encounter.hpcs}
          historySnapshot={encounter.historySnapshot}
          ros={encounter.ros}
          initialImpression={encounter.assessment?.pharmacistImpression || ""}
        />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
