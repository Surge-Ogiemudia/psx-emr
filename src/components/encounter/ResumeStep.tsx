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
      <div className="card">
        <div className="card-title">🔬 Tests that were ordered</div>
        <div className="condition-tags">
          {testsRecommended.map((t) => (
            <span key={t} className="condition-tag tag-condition">{t}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">📎 Upload results</div>
        {!uploaded ? (
          <div className="field" style={{ textAlign: "center", cursor: "pointer" }} onClick={uploadResult}>
            Tap to upload result image or file — stubbed for now
          </div>
        ) : summarizing ? (
          <div className="ai-processing">
            <div className="ai-dot" />
            <span className="ai-text">Gemma is reading the uploaded result…</span>
          </div>
        ) : (
          <textarea
            className="field"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Result summary — review and edit before continuing…"
          />
        )}
      </div>

      <button className="cta-btn" disabled={!uploaded || summarizing || continuing} onClick={continueToClose}>
        {continuing ? "Continuing…" : "Continue to close encounter"}
      </button>
    </>
  );
}
