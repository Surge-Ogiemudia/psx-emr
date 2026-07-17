const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.encounter.findMany({
  where: { managementPlan: { isNot: null } },
  include: { patient: true }
}).then(res => {
  const chikas = res.filter(r => r.patient.fullName.includes("Chika"));
  if (chikas.length > 0) {
    console.log("Chika Pharmacy IDs:", chikas.map(c => c.pharmacyId));
    prisma.pharmacy.findUnique({ where: { id: chikas[0].pharmacyId } }).then(p => {
      console.log("Pharmacy details:", p);
    });
  } else {
    console.log("Chika not found");
  }
}).finally(() => prisma.$disconnect());
