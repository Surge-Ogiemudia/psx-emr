"use client";

import { useState, useRef, useEffect } from "react";
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "16px", position: "relative" }} ref={dropdownRef}>
      
      {/* Trigger */}
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(8px)",
          padding: "4px 10px 4px 6px",
          borderRadius: "30px",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          cursor: "pointer",
        }}
      >
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
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "white", lineHeight: 1.2 }}>
            {userName.split(" ")[0]}
          </span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
            ▼ Menu
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          background: "white",
          borderRadius: "16px",
          padding: "8px",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
          minWidth: "200px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          zIndex: 1000,
          color: "#333",
        }}>
          <Link
            href="/analytics"
            onClick={() => setShowDropdown(false)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#f3f4f6"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            📊 Analytics Dashboard
          </Link>

          <button
            onClick={() => {
              setShowKeyModal(true);
              setShowDropdown(false);
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#f3f4f6"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            🔑 API Settings
          </button>

          <div style={{ height: "1px", background: "#e5e7eb", margin: "4px 0" }} />

          <form action={signOutAction} style={{ margin: 0 }}>
            <button 
              type="submit" 
              style={{ 
                width: "100%",
                padding: "10px 16px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#fee2e2"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              🚪 Log Out
            </button>
          </form>
        </div>
      )}

      <ApiKeySettingsModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />
    </div>
  );
}

