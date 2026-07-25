import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import ReferStep from "@/components/encounter/ReferStep";

import { getEncounterOrNotFound } from "@/lib/encounter-context";

export default async function ReferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);

  return (
    <AppShell>
      <TopBar
        title="Refer patient"
        subtitle="Send to physician or specialist"
        backHref={`/encounter/${id}/management`}
        backLabel="Management Plan"
      />
      <div className="screen-content">
        <ReferStep 
          encounterId={id} 
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
