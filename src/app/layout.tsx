import type { Metadata } from "next";
import "./globals.css";

// Every page here reads the logged-in user's session (getSsoSession/requireEmrAccess
// in lib/tenant.ts) to decide what to show. Without this, Next.js/Vercel can
// statically prerender a route and cache that single response for everyone —
// which is exactly what happened to "/": it got frozen as the logged-out /login
// redirect and served stale to every visitor regardless of their real session.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pharmacy EMR",
  description: "emr.psx.ng — pharmacy-level patient consultation and medical records",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
