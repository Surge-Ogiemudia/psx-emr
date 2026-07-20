"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { summarizeDiagnosticResult } from "@/lib/ai/client";

export default function ResumeStep({
  encounterId,
  testsRecommended,
}: {
  encounterId: string;
  testsRecommended: string[];
}) {
  const router = useRouter();
  const [uploaded, setUploaded] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState("");
  const [continuing, setContinuing] = useState(false);

  async function uploadResult() {
    setUploaded(true);
    setSummarizing(true);
    // TODO: pass the real uploaded File through to summarizeDiagnosticResult.
    const result = await summarizeDiagnosticResult(new File([], "result.pdf"));
    setSummary(result);
    setSummarizing(false);
  }

  async function continueToClose() {
    setContinuing(true);
    await fetch(`/api/encounters/${encounterId}/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultFiles: uploaded ? ["stub-result.pdf"] : [], resultSummary: summary }),
    });
    router.push(`/encounter/${encounterId}/management`);
  }

  return (
    <>
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🔬</span> Tests that were ordered
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {testsRecommended.map((t) => (
            <span key={t} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#334155", borderRadius: "20px", fontSize: "12px", fontWeight: 600, border: "1px solid #e2e8f0" }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📎</span> Upload results
        </div>
        {!uploaded ? (
          <div style={{ width: "100%", padding: "24px", border: "2px dashed #bae6fd", borderRadius: "12px", background: "#f0f9ff", color: "#0284c7", fontSize: "14px", fontWeight: 600, textAlign: "center", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.background = "#e0f2fe"; e.currentTarget.style.borderColor = "#7dd3fc"; }} onMouseOut={(e) => { e.currentTarget.style.background = "#f0f9ff"; e.currentTarget.style.borderColor = "#bae6fd"; }} onClick={uploadResult}>
            Tap to upload result image or file — stubbed for now
          </div>
        ) : summarizing ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderRadius: "12px", color: "#7e22ce", border: "1px solid #e9d5ff" }}>
            <div className="ai-dot" />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Gemma is reading the uploaded result…</span>
          </div>
        ) : (
          <textarea
            style={{ width: "100%", minHeight: "120px", padding: "16px", borderRadius: "12px", border: "1px solid #e4e4e7", background: "#f8fafc", fontSize: "14px", lineHeight: 1.5, color: "#18181b", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
            onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#ffffff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.background = "#f8fafc"; }}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Result summary — review and edit before continuing…"
          />
        )}
      </div>

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: uploaded && !summarizing ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
        color: uploaded && !summarizing ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
        cursor: uploaded && !summarizing ? "pointer" : "not-allowed", boxShadow: uploaded && !summarizing ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
        transition: "all 0.2s", opacity: continuing ? 0.7 : 1
      }} disabled={!uploaded || summarizing || continuing} onClick={continueToClose}>
        {continuing ? "Continuing…" : "Continue to close encounter"}
      </button>
    </>
  );
}
