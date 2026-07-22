import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.callback-url" : "authjs.callback-url",
      options: {
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production" ? "__Host-authjs.csrf-token" : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
        ssoToken: { label: "SSO Token", type: "text" },
        mainPsxToken: { label: "Main PSX Token", type: "text" },
      },
      async authorize(credentials) {
        // Main PSX JWT authentication path (used by Terminal iframe bridge)
        if (credentials?.mainPsxToken) {
          try {
            const decoded = jwt.verify(String(credentials.mainPsxToken), JWT_SECRET) as {
              userId: string;
              role: string;
              email?: string;
              pharmacyId?: string;
              name?: string;
              businessName?: string;
            };

            const mappedRole = decoded.role === 'pharmacy' ? 'admin' : decoded.role;
            let finalName = decoded.name || decoded.email || 'User';
            const targetPharmacyId = decoded.role === 'pharmacy' ? decoded.userId : (decoded.pharmacyId || decoded.userId);

            // Lazy provision pharmacy for all roles so the EMR can display the correct name
            if (targetPharmacyId) {
              let pharmacy = await prisma.pharmacy.findUnique({ where: { id: targetPharmacyId } });
              if (!pharmacy) {
                pharmacy = await prisma.pharmacy.create({
                  data: {
                    id: targetPharmacyId,
                    name: decoded.businessName || "My Pharmacy",
                    subdomain: targetPharmacyId.slice(-6),
                  }
                });
              } else if (pharmacy.name === "My Pharmacy" || pharmacy.name === "Pharmacy") {
                if (decoded.businessName) {
                  await prisma.pharmacy.update({
                    where: { id: targetPharmacyId },
                    data: { name: decoded.businessName }
                  });
                }
              }
            } else {
              // Try to fetch full name from EMR staff collection just in case Main PSX didn't have it
              const staff = await prisma.staff.findUnique({ where: { id: decoded.userId } });
              if (staff && staff.fullName) {
                finalName = staff.fullName;
              }
            }

            return {
              id: decoded.userId,
              email: decoded.email || '',
              name: finalName,
              pharmacyId: decoded.pharmacyId || decoded.userId,
              role: mappedRole,
            };
          } catch {
            return null;
          }
        }

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

        const phoneNumber = String(credentials.phoneNumber).trim();
        const password = String(credentials.password);

        // Authenticate against Main PSX
        const mainPsxUrl = process.env.NODE_ENV === 'production' ? 'https://www.psx.ng' : 'http://localhost:3000';
        const loginRes = await fetch(`${mainPsxUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, password })
        });

        if (!loginRes.ok) {
          return null;
        }

        const data = await loginRes.json();
        const user = data.user;

        if (!user || !user.id) return null;

        // Lazy Provisioning for Pharmacy Role
        if (user.role === 'pharmacy') {
          let pharmacy = await prisma.pharmacy.findUnique({ where: { id: user.id } });
          if (!pharmacy) {
            pharmacy = await prisma.pharmacy.create({
              data: {
                id: user.id,
                name: user.businessName || user.name || "My Pharmacy",
                subdomain: user.slug || user.id.slice(-6),
              }
            });
          }
        }

        const mappedRole = user.role === 'pharmacy' ? 'admin' : user.role;

        return {
          id: user.id,
          email: user.email || user.phoneNumber,
          name: user.name,
          pharmacyId: user.pharmacyId || user.id,
          role: mappedRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.pharmacyId = (user as any).pharmacyId;
        // Map Main PSX 'pharmacy' role to EMR 'admin' role
        token.role = (user as any).role === 'pharmacy' ? 'admin' : (user as any).role;
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

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function getSsoSession() {
  let session = await auth();
  
  if (!session?.user) {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const mappedRole = decoded.role === 'pharmacy' ? 'admin' : decoded.role;
        session = {
          user: {
            id: decoded.userId,
            name: decoded.name || 'User',
            pharmacyId: decoded.pharmacyId || decoded.userId,
            role: mappedRole,
            email: decoded.email || decoded.phoneNumber,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        } as any;
      } catch (e) {
        // Ignore invalid token
      }
    }
  }
  
  return session;
}

// Removed duplicate export
