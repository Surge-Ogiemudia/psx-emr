import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import DiagnosticsStep from "@/components/encounter/DiagnosticsStep";
import { getEncounterOrNotFound } from "@/lib/encounter-context";

export default async function DiagnosticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);

  return (
    <AppShell>
      <TopBar
        title="Recommend diagnostics"
        subtitle="Tests ordered + optional interim treatment"
        backHref={`/encounter/${id}/management`}
        backLabel="Management Plan"
      />
      <div className="screen-content">
        <DiagnosticsStep encounterId={id} patientId={encounter.patientId} />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
