import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import QuickDispenseForm from "@/components/encounter/QuickDispenseForm";

export default async function QuickDispensePage() {
  return (
    <AppShell>
      <TopBar
        title="Quick Dispense"
        subtitle="Ailment → Medicine → Done"
        backHref="/"
        backLabel="Dashboard"
      />
      <div className="screen-content">
        <QuickDispenseForm />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
