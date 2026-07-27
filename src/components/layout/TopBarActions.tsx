"use client";

import { useState } from "react";
import Link from "next/link";
import ApiKeySettingsModal from "@/components/settings/ApiKeySettingsModal";

export default function TopBarActions({
  userName,
  initials,
  signOutAction,
}: {
  userName: string;
  initials: string;
  signOutAction: () => Promise<void>;
}) {
  const [showKeyModal, setShowKeyModal] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "16px" }}>
      <Link
        href="/analytics"
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 800,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        📊 Analytics
      </Link>

      <button
        type="button"
        onClick={() => setShowKeyModal(true)}
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        🔑 API Keys
      </button>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(8px)",
        padding: "4px 10px 4px 6px",
        borderRadius: "30px",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: "800",
          color: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          flexShrink: 0
        }}>
          {initials}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "white", lineHeight: 1.2 }}>
            {userName.split(" ")[0]}
          </span>
          <form action={signOutAction}>
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

      <ApiKeySettingsModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />
    </div>
  );
}
