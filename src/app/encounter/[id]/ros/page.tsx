import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import StepProgress from "@/components/layout/StepProgress";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import RosStep from "@/components/encounter/RosStep";
import { getEncounterOrNotFound } from "@/lib/encounter-context";

export default async function RosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);

  return (
    <AppShell>
      <TopBar
        title="Review of systems"
        subtitle="Quick yes / no / unsure — under 60 seconds"
        backHref={`/encounter/${id}/history`}
        backLabel="History"
      />
      <StepProgress step={5} />
      <div className="screen-content">
        <RosStep
          encounterId={id}
          complaintSummary={encounter.complaint?.gemmaSummary ?? encounter.complaint?.textInput ?? ""}
        />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
