import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import TreatStep from "@/components/encounter/TreatStep";

export default async function TreatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <TopBar
        title="Treat patient"
        subtitle="Medicines, advice, follow up"
        backHref={`/encounter/${id}/management`}
        backLabel="Management Plan"
      />
      <div className="screen-content">
        <TreatStep encounterId={id} />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
