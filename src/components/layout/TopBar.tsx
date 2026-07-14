import Link from "next/link";
import { auth, signOut } from "@/auth";

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
  const session = await auth();
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
    <div className="top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        {backHref && (
          <Link href={backHref} className="back">
            ← {backLabel ?? "Back"}
          </Link>
        )}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {session?.user && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "white" }}>
              {userName}
            </span>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}>
              <button 
                type="submit" 
                style={{ 
                  fontSize: "9px", 
                  color: "rgba(255,255,255,0.7)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: "2px 0"
                }}
              >
                Log Out
              </button>
            </form>
          </div>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "700",
            color: "white",
            border: "1px solid rgba(255,255,255,0.15)",
            flexShrink: 0
          }}>
            {initials}
          </div>
        </div>
      )}
    </div>
  );
}
