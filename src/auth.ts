import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
        ssoToken: { label: "SSO Token", type: "text" },
      },
      async authorize(credentials) {
        // 1. SSO Token authentication path
        if (credentials?.ssoToken) {
          const tokenRecord = await prisma.ssoToken.findUnique({
            where: { token: credentials.ssoToken as string },
          });

          if (tokenRecord && tokenRecord.expiresAt > new Date()) {
            // Delete the token immediately to ensure single-use
            await prisma.ssoToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});

            const staff = await prisma.staff.findUnique({
              where: { id: tokenRecord.userId },
              include: { pharmacy: true },
            });

            if (staff) {
              return {
                id: staff.id,
                email: staff.phoneNumber, // Map phoneNumber to email field to fit NextAuth User type
                name: staff.fullName,
                pharmacyId: staff.pharmacyId,
                role: staff.role,
              };
            }
          }
          return null;
        }

        // 2. Standard phone/password authentication path
        if (!credentials?.phoneNumber || !credentials?.password) {
          return null;
        }

        const staff = await prisma.staff.findUnique({
          where: { phoneNumber: credentials.phoneNumber as string },
          include: { pharmacy: true },
        });

        if (!staff || !staff.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          staff.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: staff.id,
          email: staff.phoneNumber,
          name: staff.fullName,
          pharmacyId: staff.pharmacyId,
          role: staff.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.pharmacyId = (user as any).pharmacyId;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).pharmacyId = token.pharmacyId as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
