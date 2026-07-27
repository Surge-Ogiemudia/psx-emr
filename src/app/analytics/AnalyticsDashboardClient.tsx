"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";

export default function AnalyticsDashboardClient({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);

  const {
    totalPatients,
    totalEncounters,
    treatedCount,
    referredCount,
    diagnosticCount,
    recentEncounters,
  } = data;

  function handleShareLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="screen-content" style={{ paddingBottom: 100 }}>
      
      {/* Top Controls & PDF Export */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#18181b", margin: 0 }}>Executive Clinical Dashboard</h2>
          <div style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>Real-time pharmacy encounter breakdown & seasonal metrics</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #d4d4d8", background: "#ffffff", color: "#18181b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            📄 Export PDF Report
          </button>
          <button
            type="button"
            onClick={handleShareLink}
            style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#0F6E56", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            {copied ? "✓ Link Copied!" : "🔗 Share Link"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Total Patients</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#18181b", marginTop: 4 }}>{totalPatients}</div>
          <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4, fontWeight: 600 }}>Active EMR Records</div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Total Consultations</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0F6E56", marginTop: 4 }}>{totalEncounters}</div>
          <div style={{ fontSize: 12, color: "#0F6E56", marginTop: 4, fontWeight: 600 }}>Recorded Sessions</div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Treated / Dispensed</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#8b5cf6", marginTop: 4 }}>{treatedCount}</div>
          <div style={{ fontSize: 12, color: "#6d28d9", marginTop: 4, fontWeight: 600 }}>
            {totalEncounters > 0 ? Math.round((treatedCount / totalEncounters) * 100) : 0}% of sessions
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Physician Referrals</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#4338ca", marginTop: 4 }}>{referredCount}</div>
          <div style={{ fontSize: 12, color: "#3730a3", marginTop: 4, fontWeight: 600 }}>
            {totalEncounters > 0 ? Math.round((referredCount / totalEncounters) * 100) : 0}% of sessions
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#71717a", textTransform: "uppercase" }}>Diagnostics Requested</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0ea5e9", marginTop: 4 }}>{diagnosticCount}</div>
          <div style={{ fontSize: 12, color: "#0284c7", marginTop: 4, fontWeight: 600 }}>
            {totalEncounters > 0 ? Math.round((diagnosticCount / totalEncounters) * 100) : 0}% of sessions
          </div>
        </div>
      </div>

      {/* Outcome Visual Distribution Bar */}
      <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#18181b", margin: "0 0 12px 0" }}>Consultation Outcomes Breakdown</h3>
        <div style={{ height: 24, borderRadius: 12, overflow: "hidden", display: "flex", background: "#f4f4f5" }}>
          {totalEncounters > 0 && (
            <>
              <div style={{ width: `${(treatedCount / totalEncounters) * 100}%`, background: "#8b5cf6" }} title="Treated" />
              <div style={{ width: `${(referredCount / totalEncounters) * 100}%`, background: "#4338ca" }} title="Referred" />
              <div style={{ width: `${(diagnosticCount / totalEncounters) * 100}%`, background: "#0ea5e9" }} title="Diagnostics" />
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 12, fontWeight: 600 }}>
          <span style={{ color: "#8b5cf6" }}>■ Treated ({treatedCount})</span>
          <span style={{ color: "#4338ca" }}>■ Referred ({referredCount})</span>
          <span style={{ color: "#0ea5e9" }}>■ Diagnostics Ordered ({diagnosticCount})</span>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e4e4e7", padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#18181b", margin: "0 0 16px 0" }}>Recent Clinical Activity</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recentEncounters.length === 0 ? (
            <div style={{ fontSize: 14, color: "#71717a" }}>No encounter records available yet.</div>
          ) : (
            recentEncounters.slice(0, 10).map((enc: any) => (
              <div key={enc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #f4f4f5" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>{enc.complaint?.gemmaSummary || enc.complaint?.textInput || "General Consultation"}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{formatDateTime(enc.encounterDate)}</div>
                </div>
                <span style={{ 
                  fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 6, textTransform: "uppercase",
                  background: enc.exitType === "treated" ? "#f5f3ff" : enc.exitType === "referred" ? "#eef2ff" : "#f0f9ff",
                  color: enc.exitType === "treated" ? "#6d28d9" : enc.exitType === "referred" ? "#3730a3" : "#0369a1"
                }}>
                  {enc.exitType || "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
