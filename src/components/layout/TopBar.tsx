import Link from "next/link";
import { getSsoSession, signOut } from "@/auth";

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
            gap: "6px",
            fontWeight: 600,
            textDecoration: "none",
            background: "rgba(255, 255, 255, 0.15)",
            padding: "4px 10px",
            borderRadius: "20px",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s"
          }}>
            ← {backLabel ?? "Back"}
          </Link>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px", margin: 0, color: "#ffffff" }}>{title}</h2>
          <span style={{
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            padding: "3px 8px",
            borderRadius: "12px",
            backdropFilter: "blur(6px)"
          }}>EMR</span>
        </div>
        {subtitle && <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.88)", marginTop: "4px", fontWeight: 500, margin: 0 }}>{subtitle}</p>}
      </div>

      {session?.user && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "16px" }}>
          <Link
            href="/analytics"
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              padding: "8px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 800,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            📊 Analytics
          </Link>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
            padding: "6px 12px 6px 8px",
            borderRadius: "30px",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "800",
              color: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "white", lineHeight: 1.2 }}>
                {userName.split(" ")[0]}
              </span>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}>
                <button 
                  type="submit" 
                  style={{ 
                    fontSize: "10px", 
                    color: "rgba(255,255,255,0.85)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    fontWeight: "800",
                    cursor: "pointer",
                    padding: 0,
                    margin: 0,
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    lineHeight: 1.2,
                    textDecoration: "underline"
                  }}
                >
                  Log Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
