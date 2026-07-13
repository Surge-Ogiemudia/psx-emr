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
      {visibleExits.map((e) => (
        <button
          key={e.key}
          className={`exit-card ${selected === e.key ? "selected" : ""}`}
          onClick={() => setSelected(e.key)}
        >
          <div className={`exit-icon ${e.iconCls}`}>{e.icon}</div>
          <div className="exit-info">
            <div className="exit-title">{e.title}</div>
            <div className="exit-sub">{e.sub}</div>
          </div>
        </button>
      ))}

      {!allowDiagnostics && (
        <div style={{ fontSize: 10.5, color: "var(--muted)", padding: "0 2px" }}>
          Diagnostics already requested for this encounter — close with Treat or Refer.
        </div>
      )}

      <button
        className="cta-btn"
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
