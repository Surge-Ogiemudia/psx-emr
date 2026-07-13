import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import ConsentStep from "@/components/encounter/ConsentStep";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const { patientId } = await searchParams;
  if (!patientId) redirect("/encounter/new");

  return (
    <AppShell>
      <TopBar
        title="Before we begin"
        subtitle="New patient · First visit"
        backHref="/encounter/new"
        backLabel="New patient"
      />
      <div className="screen-content">
        <ConsentStep patientId={patientId} />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
