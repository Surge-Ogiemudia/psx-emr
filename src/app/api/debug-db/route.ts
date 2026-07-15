import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || "NOT_SET";
    const maskedUrl = url.replace(/:([^:@]+)@/, ":***@");

    const user = await prisma.staff.findUnique({
      where: { phoneNumber: "09050006638" },
      include: { pharmacy: true }
    });

    const ssoTokensCount = await prisma.ssoToken.count();

    return NextResponse.json({
      databaseUrl: maskedUrl,
      foundUser: user ? true : false,
      userName: user ? user.fullName : null,
      ssoTokensCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
