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
      background: "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)", 
      padding: "20px 20px 24px", 
      color: "white", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      boxShadow: "0 4px 24px rgba(15, 118, 110, 0.2)",
      borderBottomLeftRadius: "24px",
      borderBottomRightRadius: "24px",
      marginBottom: "8px",
      zIndex: 10,
      position: "relative"
    }}>
      <div style={{ flex: 1 }}>
        {backHref && (
          <Link href={backHref} style={{ 
            fontSize: "13px", 
            color: "rgba(255, 255, 255, 0.8)", 
            marginBottom: "8px", 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "4px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "white"}
          onMouseOut={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)"}
          >
            ← {backLabel ?? "Back"}
          </Link>
        )}
        <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.85)", marginTop: "2px", fontWeight: 500, margin: 0 }}>{subtitle}</p>}
      </div>

      {session?.user && (
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginLeft: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "white" }}>
              {userName}
            </span>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}>
              <button 
                type="submit" 
                style={{ 
                  fontSize: "10px", 
                  color: "rgba(255,255,255,0.7)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em",
                  fontWeight: "800",
                  cursor: "pointer",
                  padding: "2px 0",
                  background: "transparent",
                  border: "none",
                  transition: "color 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "white"}
                onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
              >
                Log Out
              </button>
            </form>
          </div>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: "800",
            color: "white",
            border: "2px solid rgba(255,255,255,0.3)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            flexShrink: 0
          }}>
            {initials}
          </div>
        </div>
      )}
    </div>
  );
}
