import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import StepProgress from "@/components/layout/StepProgress";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import HpcStep from "@/components/encounter/HpcStep";
import { getEncounterOrNotFound } from "@/lib/encounter-context";
import { parseJson } from "@/lib/types";
import type { ComplaintSegment } from "@/lib/types";

export default async function HpcPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);
  const segments = parseJson<ComplaintSegment[]>(
    encounter.complaint?.complaintSegments,
    [],
  );

  return (
    <AppShell>
      <TopBar
        title="A few more questions"
        subtitle="Generated for her/his specific complaints"
        backHref={`/encounter/${id}/complaint`}
        backLabel="Complaint"
      />
      <StepProgress step={3} />
      <div className="screen-content">
        <HpcStep 
          encounterId={id} 
          segments={segments}
          existingHpcs={encounter.hpcs}
          existingAudioUrl={encounter.hpcAudioUrl}
          existingTranscript={encounter.hpcVoiceTranscript}
        />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
