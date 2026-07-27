import Link from "next/link";
import { getSsoSession, signOut } from "@/auth";
import TopBarActions from "./TopBarActions";

export default async function TopBar({
  title,
  subtitle,
  backHref,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const session = await getSsoSession();
  const userName = session?.user?.name || "";
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div style={{ 
      background: "linear-gradient(135deg, rgba(15, 118, 110, 0.96) 0%, rgba(13, 148, 136, 0.96) 50%, rgba(2, 132, 199, 0.96) 100%)", 
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      padding: "18px 24px 22px", 
      color: "white", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      boxShadow: "0 8px 30px -4px rgba(15, 118, 110, 0.3)",
      borderBottomLeftRadius: "24px",
      borderBottomRightRadius: "24px",
      marginBottom: "16px",
      zIndex: 100,
      position: "sticky",
      top: 0
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {backHref && (
          <Link href={backHref} style={{ 
            fontSize: "12px", 
            color: "rgba(255, 255, 255, 0.85)", 
            marginBottom: "6px", 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "4px",
            textDecoration: "none",
            fontWeight: 600
          }}>
            ← {backLabel || "Back"}
          </Link>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "white", margin: 0, letterSpacing: "-0.5px" }}>{title}</h2>
          <span style={{ 
            fontSize: "10px", 
            fontWeight: "800", 
            background: "rgba(255, 255, 255, 0.2)", 
            color: "white", 
            padding: "2px 8px", 
            borderRadius: "12px",
            letterSpacing: "0.05em",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(6px)"
          }}>EMR</span>
        </div>
        {subtitle && <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.88)", marginTop: "4px", fontWeight: 500, margin: 0 }}>{subtitle}</p>}
      </div>

      {session?.user && (
        <TopBarActions
          userName={userName}
          initials={initials}
          signOutAction={handleSignOut}
        />
      )}
    </div>
  );
}
