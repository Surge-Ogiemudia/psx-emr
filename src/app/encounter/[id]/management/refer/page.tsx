import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import ReferStep from "@/components/encounter/ReferStep";

export default async function ReferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <TopBar
        title="Refer patient"
        subtitle="Send to physician or specialist"
        backHref={`/encounter/${id}/management`}
        backLabel="Management Plan"
      />
      <div className="screen-content">
        <ReferStep encounterId={id} />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
