"use server";

import { prisma } from "@/lib/prisma";

export async function createWalkInPatient(pharmacyId: string, fullName: string, phoneNumber: string) {
  if (!pharmacyId || !fullName) {
    throw new Error("Missing required fields");
  }

  const patient = await prisma.patient.create({
    data: {
      pharmacyId,
      fullName,
      phoneNumber: phoneNumber || "00000000000",
      isWalkIn: true,
    },
  });

  return {
    id: patient.id,
    fullName: patient.fullName,
    phoneNumber: patient.phoneNumber,
  };
}
