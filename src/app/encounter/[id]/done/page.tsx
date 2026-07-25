import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import { getEncounterOrNotFound } from "@/lib/encounter-context";

export default async function DonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const encounter = await getEncounterOrNotFound(id);
  const plan = encounter.managementPlan;

  return (
    <AppShell>
      <TopBar title="Encounter closed" subtitle={encounter.patient.fullName} />
      <div className="screen-content" style={{ alignItems: "center", textAlign: "center", paddingTop: 40 }}>
        <div style={{ fontSize: 40 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Encounter recorded</div>
        <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 320 }}>
          {plan?.linkedTransactionId
            ? `Sent to POS — transaction ${plan.linkedTransactionId} is ready at the counter.`
            : "This encounter has been saved to the patient record."}
        </div>
        <Link href={`/encounter/${encounter.id}/review`} className="cta-btn" style={{ marginTop: 24, maxWidth: 280 }}>
          Review full encounter
        </Link>
        <Link href={`/patients/${encounter.patientId}`} className="cta-btn secondary" style={{ marginTop: 16, maxWidth: 280 }}>
          View patient record
        </Link>
        <Link href="/" className="cta-btn secondary" style={{ maxWidth: 280, marginTop: 16 }}>
          Back to patients
        </Link>
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
