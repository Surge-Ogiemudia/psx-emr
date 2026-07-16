const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Get the most recent SSO token
    const tokenRecord = await prisma.ssoToken.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!tokenRecord) {
      console.log("No SSO tokens found.");
      return;
    }
    
    console.log("Found SSO Token:", tokenRecord);
    
    // 2. Try to find the user using Mongoose-style raw query to see if they exist
    const rawUser = await prisma.staff.findRaw({
      filter: { _id: { $oid: tokenRecord.userId } }
    });
    console.log("Raw User from DB:", rawUser);
    
    // 3. Try to find the user using Prisma
    const staff = await prisma.staff.findUnique({
      where: { id: tokenRecord.userId },
      include: { pharmacy: true },
    });
    
    console.log("Prisma User:", staff);
    
  } catch (e) {
    console.error("Error during Prisma query:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
