import DispensaryList from "@/components/dispensary/DispensaryList";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";

export default async function EmbedDispensaryPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; pharmacyId?: string }>;
}) {
  const { patientId, pharmacyId: queryPharmacyId } = await searchParams;
  const sessionPharmacy = await getCurrentPharmacy();
  let pharmacyId = queryPharmacyId || sessionPharmacy?.id;

  // If a slug is passed (not a valid ObjectId), resolve it to the pharmacy ID
  if (pharmacyId && !pharmacyId.match(/^[0-9a-fA-F]{24}$/)) {
    const p = await prisma.pharmacy.findUnique({
      where: { subdomain: pharmacyId }
    });
    if (p) {
      pharmacyId = p.id;
    } else {
      pharmacyId = undefined;
    }
  }

  if (!patientId && !pharmacyId) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontFamily: "sans-serif" }}>
        No pharmacy or patient selected
      </div>
    );
  }

  // Fetch encounters for this specific patient OR pharmacy
  const encounters = await prisma.encounter.findMany({
    where: {
      ...(patientId ? { patientId } : {}),
      ...(pharmacyId ? { pharmacyId } : {}),
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
  });

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
        patientId: enc.patientId,
        patientName: enc.patient.fullName,
        patientPhone: enc.patient.phoneNumber,
        patientPhoto: enc.patient.photoUrl || null,
        medicines,
        date: enc.encounterDate.toISOString(),
        staffName: enc.staff.fullName,
        fulfilled: enc.managementPlan!.dispensaryFulfilled,
      };
    });
  const walkIns = await prisma.patient.findMany({
    where: {
      ...(pharmacyId ? { pharmacyId } : {}),
      isWalkIn: true,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, phoneNumber: true },
  });

  const searchParamsAwaited = await searchParams;
  const isWidget = (searchParamsAwaited as any).widget === "true";

  return (
    <div style={{ background: "transparent" }}>
      <style dangerouslySetInnerHTML={{ __html: "html, body { height: auto !important; min-height: 0 !important; background: transparent !important; }" }} />
      <DispensaryList prescriptions={JSON.parse(JSON.stringify(prescriptions))} walkIns={walkIns} isEmbed={true} isWidget={isWidget} pharmacyId={pharmacyId} />
    </div>
  );
}
