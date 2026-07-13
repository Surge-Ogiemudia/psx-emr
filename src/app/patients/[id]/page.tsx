import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import LockedIdentity from "@/components/patient/LockedIdentity";
import EncounterTimeline from "@/components/patient/EncounterTimeline";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";

export default async function PatientRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      encounters: {
        orderBy: { encounterDate: "desc" },
        include: {
          complaint: true,
          hpcs: true,
          historySnapshot: true,
          ros: true,
          assessment: true,
          managementPlan: true,
          staff: { select: { fullName: true } },
        },
      },
    },
  });

  if (!patient) notFound();

  const hasActiveEncounter = patient.encounters.some((e) => e.status === "active");

  return (
    <AppShell>
      <TopBar
        title={patient.fullName}
        subtitle={`${patient.encounters.length} encounters · Last visit ${
          patient.lastVisitAt ? formatRelative(patient.lastVisitAt) : "never"
        }`}
        backHref="/"
        backLabel="Patients"
      />
      <div className="screen-content">
        <LockedIdentity
          patient={JSON.parse(JSON.stringify(patient))}
          locked={hasActiveEncounter}
        />

        <div className="section-header">Encounter history</div>
        <EncounterTimeline encounters={JSON.parse(JSON.stringify(patient.encounters))} />

        <Link href={`/encounter/new?patientId=${patient.id}`} className="cta-btn">
          + Start new encounter
        </Link>
      </div>
      <FooterDisclaimer />
      <BottomNav />
    </AppShell>
  );
}
