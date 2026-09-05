import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import QuickDispenseDone from "@/components/encounter/QuickDispenseDone";

export default async function QuickDispenseDonePage() {
  return (
    <AppShell>
      <TopBar title="Dispensed" subtitle="Quick dispense complete" backHref="/" backLabel="Dashboard" />
      <div className="screen-content">
        <QuickDispenseDone />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
