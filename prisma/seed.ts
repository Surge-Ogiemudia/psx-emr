import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface SeedPatientInput {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: Date;
  gender: string;
  knownAllergies?: { substance: string; severity: string; note?: string }[];
  chronicConditions?: string[];
  currentMedications?: { name: string; dose: string }[];
  consentTimestamp: Date;
  lastVisitAt: Date | null;
}

async function seedPharmacy(config: {
  name: string;
  subdomain: string;
  brandColor: string;
  branchName: string;
  branchAddress: string;
  staffFullName: string;
  staffEmail: string;
  staffPassword: string;
  patients: SeedPatientInput[];
}) {
  const pharmacy = await prisma.pharmacy.upsert({
    where: { subdomain: config.subdomain },
    update: {},
    create: {
      name: config.name,
      subdomain: config.subdomain,
      brandColor: config.brandColor,
    },
  });

  let branch = await prisma.branch.findFirst({
    where: { pharmacyId: pharmacy.id, name: config.branchName },
  });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        pharmacyId: pharmacy.id,
        name: config.branchName,
        address: config.branchAddress,
      },
    });
  }

  const passwordHash = await bcrypt.hash(config.staffPassword, 10);

  const staff = await prisma.staff.upsert({
    where: { email: config.staffEmail },
    update: { passwordHash },
    create: {
      pharmacyId: pharmacy.id,
      branchId: branch.id,
      fullName: config.staffFullName,
      email: config.staffEmail,
      role: "pharmacist",
      passwordHash,
    },
  });

  for (const p of config.patients) {
    const existingPatient = await prisma.patient.findFirst({
      where: { pharmacyId: pharmacy.id, phoneNumber: p.phoneNumber },
    });
    if (!existingPatient) {
      await prisma.patient.create({
        data: {
          pharmacyId: pharmacy.id,
          branchId: branch.id,
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          knownAllergies: JSON.stringify(p.knownAllergies ?? []),
          chronicConditions: JSON.stringify(p.chronicConditions ?? []),
          currentMedications: JSON.stringify(p.currentMedications ?? []),
          consentGiven: true,
          consentTimestamp: p.consentTimestamp,
          lastVisitAt: p.lastVisitAt,
        },
      });
    }
  }

  return { pharmacy, branch, staff };
}

async function main() {
  const { pharmacy, branch, staff } = await seedPharmacy({
    name: "Monak Pharmacy",
    subdomain: "monak",
    brandColor: "#0F6E56",
    branchName: "Main Branch",
    branchAddress: "12 Awolowo Road, Ikoyi, Lagos",
    staffFullName: "Chidinma Eze",
    staffEmail: "pharmacist@monak.test",
    staffPassword: "password123",
    patients: [
      {
        fullName: "Amaka Nwachukwu",
        phoneNumber: "+2348012345001",
        dateOfBirth: new Date("1991-03-14"),
        gender: "female",
        knownAllergies: [
          { substance: "Penicillin", severity: "severe", note: "Anaphylaxis" },
        ],
        chronicConditions: ["Hypertension"],
        currentMedications: [{ name: "Amlodipine", dose: "5mg" }],
        consentTimestamp: new Date(),
        lastVisitAt: new Date(),
      },
      {
        fullName: "Kelvin Osagie",
        phoneNumber: "+2348012345002",
        dateOfBirth: new Date("1983-11-02"),
        gender: "male",
        knownAllergies: [{ substance: "Sulfa drugs", severity: "moderate" }],
        chronicConditions: ["Hypertension", "Type 2 Diabetes"],
        currentMedications: [
          { name: "Amlodipine", dose: "5mg" },
          { name: "Metformin", dose: "500mg" },
        ],
        consentTimestamp: new Date(Date.now() - 86_400_000 * 30),
        lastVisitAt: new Date(Date.now() - 86_400_000 * 1),
      },
      {
        fullName: "Fatima Ebuka",
        phoneNumber: "+2348012345003",
        dateOfBirth: new Date("1996-07-22"),
        gender: "female",
        consentTimestamp: new Date(Date.now() - 86_400_000 * 10),
        lastVisitAt: new Date(Date.now() - 86_400_000 * 3),
      },
      {
        fullName: "Taiwo Okonkwo",
        phoneNumber: "+2348012345004",
        dateOfBirth: new Date("1975-01-09"),
        gender: "male",
        chronicConditions: ["Angina"],
        currentMedications: [{ name: "Aspirin", dose: "75mg" }],
        consentTimestamp: new Date(Date.now() - 86_400_000 * 20),
        lastVisitAt: new Date(Date.now() - 86_400_000 * 7),
      },
    ],
  });

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

  await seedPharmacy({
    name: "Medlife Pharmacy",
    subdomain: "medlife",
    brandColor: "#1D4ED8",
    branchName: "Main Branch",
    branchAddress: "Medlife Pharmacy",
    staffFullName: "Medlife Pharmacist",
    staffEmail: "pharmacist@medlife.test",
    staffPassword: "medlife123",
    patients: [
      {
        fullName: "Ngozi Chukwu",
        phoneNumber: "+2348023456001",
        dateOfBirth: new Date("1988-05-19"),
        gender: "female",
        knownAllergies: [{ substance: "Aspirin", severity: "moderate" }],
        chronicConditions: ["Asthma"],
        consentTimestamp: new Date(Date.now() - 86_400_000 * 2),
        lastVisitAt: new Date(Date.now() - 86_400_000 * 2),
      },
      {
        fullName: "Emeka Bassey",
        phoneNumber: "+2348023456002",
        dateOfBirth: new Date("1979-09-03"),
        gender: "male",
        consentTimestamp: new Date(Date.now() - 86_400_000 * 5),
        lastVisitAt: new Date(Date.now() - 86_400_000 * 5),
      },
    ],
  });

  console.log("Seed complete: monak + medlife pharmacies ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
