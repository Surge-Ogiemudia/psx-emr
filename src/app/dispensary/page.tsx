import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import DispensaryList from "@/components/dispensary/DispensaryList";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";
import Link from "next/link";

export default async function DispensaryPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const pharmacy = await getCurrentPharmacy();
  const { patientId } = await searchParams;

  // Fetch encounters that have a management plan with medicines prescribed
  const encounters = pharmacy
    ? await prisma.encounter.findMany({
        where: {
          pharmacyId: pharmacy.id,
          ...(patientId ? { patientId } : {}),
          managementPlan: {
            isNot: null,
          },
        },
        orderBy: { encounterDate: "desc" },
        include: {
          patient: true,
          managementPlan: true,
          staff: true,
        },
      })
    : [];

  // Filter to only encounters that actually have medicines
  const prescriptions = encounters
    .filter((enc) => {
      if (!enc.managementPlan?.medicinesDispensed) return false;
      const meds = enc.managementPlan.medicinesDispensed;
      return meds !== "[]" && meds !== "" && meds !== null;
    })
    .map((enc) => {
      let medicines: any[] = [];
      try {
        const raw = enc.managementPlan!.medicinesDispensed!;
        medicines = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        medicines = [];
      }

      return {
        id: enc.id,
        patientName: enc.patient.fullName,
        patientPhone: enc.patient.phoneNumber,
        patientPhoto: enc.patient.photoUrl || null,
        medicines,
        date: enc.encounterDate.toISOString(),
        staffName: enc.staff.fullName,
        fulfilled: enc.managementPlan!.dispensaryFulfilled,
      };
    });

  return (
    <AppShell>
      <TopBar
        title="Dispensary"
        subtitle={`${prescriptions.length} prescription${prescriptions.length !== 1 ? "s" : ""}`}
        backHref="/"
        backLabel="Patients"
      />
      <div className="screen-content">
        <DispensaryList prescriptions={JSON.parse(JSON.stringify(prescriptions))} />
      </div>
      <FooterDisclaimer />
    </AppShell>
  );
}
