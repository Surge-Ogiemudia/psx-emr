import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";

import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import LockedIdentity from "@/components/patient/LockedIdentity";
import EncounterTimeline from "@/components/patient/EncounterTimeline";
import NewEncounterButton from "@/components/patient/NewEncounterButton";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { formatRelative } from "@/lib/format";

export default async function PatientRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pharmacyId = await getTenantId();
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const patient = await prisma.patient.findFirst({
    where: { id, pharmacyId },
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
          locked={false}
        />

        <div className="section-header">Encounter history</div>
        <EncounterTimeline encounters={JSON.parse(JSON.stringify(patient.encounters))} />

        <NewEncounterButton 
          patientId={patient.id} 
          hasActiveEncounter={hasActiveEncounter} 
        />
      </div>
      <FooterDisclaimer />

    </AppShell>
  );
}
