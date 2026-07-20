"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExitType } from "@/lib/enums";

const EXITS: { key: ExitType; icon: string; iconCls: string; title: string; sub: string }[] = [
  {
    key: "treated",
    icon: "💊",
    iconCls: "exit-treat",
    title: "Treat patient",
    sub: "Prescribe medicines, give advice, close encounter",
  },
  {
    key: "referred",
    icon: "↗",
    iconCls: "exit-refer",
    title: "Refer patient",
    sub: "Send to physician or specialist",
  },
  {
    key: "diagnostic",
    icon: "🔬",
    iconCls: "exit-diag",
    title: "Recommend diagnostics",
    sub: "Order tests + optional interim treatment while waiting",
  },
];

const ROUTE_BY_EXIT: Record<ExitType, string> = {
  treated: "treat",
  referred: "refer",
  diagnostic: "diagnostics",
};

export default function ManagementSelector({
  encounterId,
  allowDiagnostics = true,
}: {
  encounterId: string;
  allowDiagnostics?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ExitType | null>(null);

  const visibleExits = allowDiagnostics ? EXITS : EXITS.filter((e) => e.key !== "diagnostic");

  return (
    <>
      {visibleExits.map((e) => {
        const isSelected = selected === e.key;
        return (
          <button
            key={e.key}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "16px", padding: "20px",
              borderRadius: "16px", border: "1px solid",
              borderColor: isSelected ? "#0ea5e9" : "#e4e4e7",
              background: isSelected ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" : "#ffffff",
              cursor: "pointer", marginBottom: "16px", transition: "all 0.2s", textAlign: "left",
              boxShadow: isSelected ? "0 8px 24px -4px rgba(14, 165, 233, 0.2)" : "0 2px 8px rgba(0,0,0,0.02)",
              transform: isSelected ? "translateY(-2px)" : "translateY(0)"
            }}
            onClick={() => setSelected(e.key)}
          >
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
              background: isSelected ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#f4f4f5",
              color: isSelected ? "white" : "#52525b", boxShadow: isSelected ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none"
            }}>
              {e.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: isSelected ? "#0f172a" : "#18181b", marginBottom: "4px" }}>{e.title}</div>
              <div style={{ fontSize: "13px", color: isSelected ? "#334155" : "#71717a", lineHeight: 1.4 }}>{e.sub}</div>
            </div>
          </button>
        );
      })}

      {!allowDiagnostics && (
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#f59e0b", padding: "12px 16px", background: "#fffbeb", borderRadius: "12px", marginBottom: "16px", border: "1px solid #fde68a" }}>
          Diagnostics already requested for this encounter — close with Treat or Refer.
        </div>
      )}

      <button
        style={{
          width: "100%", padding: "16px", borderRadius: "16px", border: "none",
          background: selected ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
          color: selected ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
          cursor: selected ? "pointer" : "not-allowed", boxShadow: selected ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
          transition: "all 0.2s"
        }}
        disabled={!selected}
        onClick={() => selected && router.push(`/encounter/${encounterId}/management/${ROUTE_BY_EXIT[selected]}`)}
      >
        {selected
          ? `Continue with ${EXITS.find((e) => e.key === selected)?.title}`
          : "Choose one path to continue"}
      </button>
    </>
  );
}
