import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const pharmacy = await prisma.pharmacy.upsert({
    where: { subdomain: "monak" },
    update: {},
    create: {
      name: "Monak Pharmacy",
      subdomain: "monak",
      brandColor: "#0F6E56",
    },
  });

  let branch = await prisma.branch.findFirst({
    where: { pharmacyId: pharmacy.id, name: "Main Branch" },
  });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        pharmacyId: pharmacy.id,
        name: "Main Branch",
        address: "12 Awolowo Road, Ikoyi, Lagos",
      },
    });
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const staff = await prisma.staff.upsert({
    where: { phoneNumber: "08012345001" },
    update: { passwordHash },
    create: {
      pharmacyId: pharmacy.id,
      branchId: branch.id,
      fullName: "Chidinma Eze",
      phoneNumber: "08012345001",
      role: "pharmacist",
      passwordHash,
    },
  });

  const patients = [
    {
      fullName: "Amaka Nwachukwu",
      phoneNumber: "+2348012345001",
      dateOfBirth: new Date("1991-03-14"),
      gender: "female",
      knownAllergies: JSON.stringify([
        { substance: "Penicillin", severity: "severe", note: "Anaphylaxis" },
      ]),
      chronicConditions: JSON.stringify(["Hypertension"]),
      currentMedications: JSON.stringify([{ name: "Amlodipine", dose: "5mg" }]),
      consentGiven: true,
      consentTimestamp: new Date(),
      lastVisitAt: new Date(),
    },
    {
      fullName: "Kelvin Osagie",
      phoneNumber: "+2348012345002",
      dateOfBirth: new Date("1983-11-02"),
      gender: "male",
      knownAllergies: JSON.stringify([
        { substance: "Sulfa drugs", severity: "moderate" },
      ]),
      chronicConditions: JSON.stringify(["Hypertension", "Type 2 Diabetes"]),
      currentMedications: JSON.stringify([
        { name: "Amlodipine", dose: "5mg" },
        { name: "Metformin", dose: "500mg" },
      ]),
      consentGiven: true,
      consentTimestamp: new Date(Date.now() - 86_400_000 * 30),
      lastVisitAt: new Date(Date.now() - 86_400_000 * 1),
    },
    {
      fullName: "Fatima Ebuka",
      phoneNumber: "+2348012345003",
      dateOfBirth: new Date("1996-07-22"),
      gender: "female",
      knownAllergies: JSON.stringify([]),
      chronicConditions: JSON.stringify([]),
      currentMedications: JSON.stringify([]),
      consentGiven: true,
      consentTimestamp: new Date(Date.now() - 86_400_000 * 10),
      lastVisitAt: new Date(Date.now() - 86_400_000 * 3),
    },
    {
      fullName: "Taiwo Okonkwo",
      phoneNumber: "+2348012345004",
      dateOfBirth: new Date("1975-01-09"),
      gender: "male",
      knownAllergies: JSON.stringify([]),
      chronicConditions: JSON.stringify(["Angina"]),
      currentMedications: JSON.stringify([{ name: "Aspirin", dose: "75mg" }]),
      consentGiven: true,
      consentTimestamp: new Date(Date.now() - 86_400_000 * 20),
      lastVisitAt: new Date(Date.now() - 86_400_000 * 7),
    },
  ];

  for (const p of patients) {
    const existingPatient = await prisma.patient.findFirst({
      where: { pharmacyId: pharmacy.id, phoneNumber: p.phoneNumber },
    });
    if (!existingPatient) {
      await prisma.patient.create({
        data: { pharmacyId: pharmacy.id, branchId: branch.id, ...p },
      });
    }
  }

  // Kelvin Osagie: an encounter still awaiting diagnostics (Exit A, close-here=false)
  const kelvin = await prisma.patient.findFirst({
    where: { pharmacyId: pharmacy.id, phoneNumber: "+2348012345002" },
  });
  if (kelvin) {
    const existing = await prisma.encounter.findFirst({
      where: { patientId: kelvin.id, status: "diagnostic_pending" },
    });
    if (!existing) {
      const encounter = await prisma.encounter.create({
        data: {
          patientId: kelvin.id,
          pharmacyId: pharmacy.id,
          branchId: branch.id,
          staffId: staff.id,
          encounterDate: new Date(Date.now() - 86_400_000 * 1),
          status: "diagnostic_pending",
          exitType: "diagnostic",
        },
      });
      await prisma.complaint.create({
        data: {
          encounterId: encounter.id,
          textInput: "Fever and joint pain for two days.",
          gemmaSummary: "Fever with joint pain, 2 days duration.",
          complaintSegments: JSON.stringify([
            { label: "Fever + joint pain", summary: "Fever with joint pain, 2 days duration." },
          ]),
        },
      });
      await prisma.managementPlan.create({
        data: {
          encounterId: encounter.id,
          exitType: "diagnostic",
          diagnosticsRecommended: JSON.stringify(["Malaria RDT", "Full Blood Count"]),
          patientReturning: true,
          interimTreatment: true,
          medicinesDispensed: JSON.stringify([
            { name: "Paracetamol 500mg", dose: "2 tabs x 3 daily", qty: 6, interim: true },
          ]),
          nonPharmacologicalAdvice: "Rest, increase fluid intake, avoid self-medicating with antibiotics until results are available.",
        },
      });
    }
  }

  // Taiwo Okonkwo: a completed referred encounter
  const taiwo = await prisma.patient.findFirst({
    where: { pharmacyId: pharmacy.id, phoneNumber: "+2348012345004" },
  });
  if (taiwo) {
    const existing = await prisma.encounter.findFirst({
      where: { patientId: taiwo.id, exitType: "referred" },
    });
    if (!existing) {
      const encounter = await prisma.encounter.create({
        data: {
          patientId: taiwo.id,
          pharmacyId: pharmacy.id,
          branchId: branch.id,
          staffId: staff.id,
          encounterDate: new Date(Date.now() - 86_400_000 * 7),
          status: "complete",
          exitType: "referred",
        },
      });
      await prisma.complaint.create({
        data: {
          encounterId: encounter.id,
          textInput: "Chest tightness on exertion.",
          gemmaSummary: "Chest tightness, exertional.",
        },
      });
      await prisma.managementPlan.create({
        data: {
          encounterId: encounter.id,
          exitType: "referred",
          referralDetails: JSON.stringify({
            referredTo: "Lagos Cardiology Centre — Dr. Adebayo",
            reason: "Exertional chest tightness, history of angina — needs cardiology workup.",
            urgency: "urgent",
          }),
        },
      });
    }
  }

  // ── Medlife Pharmacy ───────────────────────────────────────────────
  const medlife = await prisma.pharmacy.upsert({
    where: { subdomain: "medlife" },
    update: {},
    create: {
      name: "Medlife Pharmacy",
      subdomain: "medlife",
      brandColor: "#1E40AF",
    },
  });

  let medlifeBranch = await prisma.branch.findFirst({
    where: { pharmacyId: medlife.id, name: "Main Branch" },
  });
  if (!medlifeBranch) {
    medlifeBranch = await prisma.branch.create({
      data: {
        pharmacyId: medlife.id,
        name: "Main Branch",
        address: "45 Sapele Road, Benin City, Edo",
      },
    });
  }

  await prisma.staff.upsert({
    where: { phoneNumber: "08012345002" },
    update: { passwordHash },
    create: {
      pharmacyId: medlife.id,
      branchId: medlifeBranch.id,
      fullName: "Emeka Okafor",
      phoneNumber: "08012345002",
      role: "pharmacist",
      passwordHash,
    },
  });

  console.log("Seed complete:", { monak: pharmacy.subdomain, medlife: medlife.subdomain });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
