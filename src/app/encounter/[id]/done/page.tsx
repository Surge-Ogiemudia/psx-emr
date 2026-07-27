import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import { getEncounterOrNotFound } from "@/lib/encounter-context";
import DonePageClient from "./DonePageClient";

export default async function DonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);

  return (
    <AppShell>
      <TopBar title="Encounter closed" subtitle={encounter.patient.fullName} />
      <DonePageClient encounter={encounter} />
      <FooterDisclaimer />
    </AppShell>
  );
}
