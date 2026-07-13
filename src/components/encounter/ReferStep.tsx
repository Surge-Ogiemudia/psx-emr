"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REFERRAL_URGENCY, type ReferralUrgency } from "@/lib/enums";

export default function ReferStep({ encounterId }: { encounterId: string }) {
  const router = useRouter();
  const [referredTo, setReferredTo] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<ReferralUrgency>("routine");
  const [closing, setClosing] = useState(false);

  async function closeEncounter() {
    setClosing(true);
    await fetch(`/api/encounters/${encounterId}/management-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exitType: "referred",
        referralDetails: { referredTo, reason, urgency },
      }),
    });
    router.push(`/encounter/${encounterId}/done`);
  }

  const canClose = referredTo.trim() && reason.trim();

  return (
    <>
      <div className="card">
        <div className="card-title">↗ Refer to</div>
        <input
          className="field"
          placeholder="Physician, specialist, hospital, or facility name…"
          value={referredTo}
          onChange={(e) => setReferredTo(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="card-title">📝 Reason for referral</div>
        <textarea
          className="field"
          placeholder="Why is this patient being referred?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="card-title">⏱ Urgency</div>
        <div className="complaint-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {REFERRAL_URGENCY.map((u) => (
            <div
              key={u}
              className={`complaint-btn ${urgency === u ? "active" : ""}`}
              onClick={() => setUrgency(u)}
            >
              <span className="cb-label" style={{ textTransform: "capitalize" }}>{u}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>
        A referral note will be generated automatically from this encounter record —
        printable or shareable as a PDF once closed.
      </div>

      <button className="cta-btn" disabled={!canClose || closing} onClick={closeEncounter}>
        {closing ? "Closing…" : "Close encounter · Generate referral note"}
      </button>
    </>
  );
}
