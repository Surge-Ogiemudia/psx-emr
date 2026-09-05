"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function QuickDispenseDone() {
  const searchParams = useSearchParams();
  const patient = searchParams.get("patient") || "Walk-in";
  const ailments = searchParams.get("ailments") || "—";
  const count = searchParams.get("count") || "0";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        paddingTop: "40px",
        paddingBottom: "120px",
      }}
    >
      {/* Success Icon */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 32px -4px rgba(16, 185, 129, 0.4)",
        }}
      >
        <span style={{ fontSize: "36px", color: "white" }}>✓</span>
      </div>

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#064e3b",
            marginBottom: "6px",
            letterSpacing: "-0.3px",
          }}
        >
          Dispensed Successfully
        </div>
        <div style={{ fontSize: "14px", color: "#71717a" }}>
          Record saved to patient history
        </div>
      </div>

      {/* Summary Card */}
      <div
        style={{
          width: "100%",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e4e4e7",
          padding: "20px",
          boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "14px",
            paddingBottom: "14px",
            borderBottom: "1px solid #f4f4f5",
          }}
        >
          <span style={{ fontSize: "13px", color: "#71717a", fontWeight: 600 }}>Patient</span>
          <span style={{ fontSize: "14px", color: "#18181b", fontWeight: 700 }}>{patient}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "14px",
            paddingBottom: "14px",
            borderBottom: "1px solid #f4f4f5",
          }}
        >
          <span style={{ fontSize: "13px", color: "#71717a", fontWeight: 600 }}>Complaint</span>
          <span style={{ fontSize: "14px", color: "#18181b", fontWeight: 700 }}>{ailments}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "#71717a", fontWeight: 600 }}>
            Medicines dispensed
          </span>
          <span style={{ fontSize: "14px", color: "#18181b", fontWeight: 700 }}>
            {count} item{count !== "1" ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
        <Link
          href="/encounter/quick"
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)",
            color: "white",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 24px -4px rgba(14, 165, 233, 0.4)",
            transition: "all 0.2s",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
          }}
        >
          ⚡ New Quick Dispense
        </Link>
        <Link
          href="/"
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #e4e4e7",
            background: "#ffffff",
            color: "#52525b",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
