const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.encounter.findMany({
  where: { managementPlan: { isNot: null }, status: "COMPLETED", managementPlan: { dispensaryFulfilled: false } },
  include: { patient: true, pharmacy: true }
}).then(res => {
  console.log(res.map(r => ({
    patient: r.patient.fullName,
    pharmacyName: r.pharmacy.name,
    pharmacySubdomain: r.pharmacy.subdomain,
    pharmacyId: r.pharmacyId
  })));
}).finally(() => prisma.$disconnect());
