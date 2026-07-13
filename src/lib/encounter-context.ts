import { notFound } from "next/navigation";
import { prisma } from "./prisma";

export async function getEncounterOrNotFound(encounterId: string) {
  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: {
      patient: true,
      complaint: true,
      hpcs: true,
      historySnapshot: true,
      ros: true,
      assessment: true,
      managementPlan: true,
    },
  });
  if (!encounter) notFound();
  return encounter;
}
