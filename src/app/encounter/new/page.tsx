import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import StepProgress from "@/components/layout/StepProgress";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import IdentificationStep from "@/components/encounter/IdentificationStep";

export default async function NewEncounterPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const { patientId } = await searchParams;

  return (
    <AppShell>
      <TopBar title="Who is this patient?" subtitle="Type or let the camera scan" backHref="/" backLabel="Patients" />
      <StepProgress step={1} />
      <div className="screen-content">
        <IdentificationStep skipToPatientId={patientId} />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
