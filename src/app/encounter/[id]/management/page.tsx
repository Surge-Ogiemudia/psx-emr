import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import StepProgress from "@/components/layout/StepProgress";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import ManagementSelector from "@/components/encounter/ManagementSelector";
import { getEncounterOrNotFound } from "@/lib/encounter-context";

export default async function ManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);

  return (
    <AppShell>
      <TopBar
        title="How do we end this?"
        subtitle="Choose one path to close this encounter"
        backHref={`/encounter/${id}/assessment`}
        backLabel="Assessment"
      />
      <StepProgress step={7} />
      <div className="screen-content">
        <ManagementSelector
          encounterId={id}
          allowDiagnostics={encounter.status !== "diagnostic_resumed"}
          clinicalContext={{
            complaintSummary: encounter.complaint?.gemmaSummary ?? encounter.complaint?.textInput ?? "",
            hpcSegments: encounter.hpcs,
            historySnapshot: encounter.historySnapshot,
            ros: encounter.ros,
            pharmacistImpression: encounter.assessment?.pharmacistImpression || "",
          }}
        />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
