"use client";

import { useState } from "react";
import Link from "next/link";
import ShareEncounterModal from "@/components/patient/ShareEncounterModal";

export default function DonePageClient({
  encounter,
}: {
  encounter: any;
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  const plan = encounter.managementPlan;

  return (
    <div className="screen-content" style={{ alignItems: "center", textAlign: "center", paddingTop: 40 }}>
      <div style={{ fontSize: 40 }}>✅</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Encounter recorded</div>
      <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 320 }}>
        {plan?.linkedTransactionId
          ? `Sent to POS — transaction ${plan.linkedTransactionId} is ready at the counter.`
          : "This encounter has been saved to the patient record."}
      </div>

      <button
        type="button"
        onClick={() => setShowShareModal(true)}
        style={{
          marginTop: 24,
          maxWidth: 280,
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          background: "#0F6E56",
          color: "white",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(15, 110, 86, 0.2)",
        }}
      >
        📤 Share Record with Patient
      </button>

      <Link href={`/encounter/${encounter.id}/review`} className="cta-btn secondary" style={{ marginTop: 12, maxWidth: 280 }}>
        Review full encounter
      </Link>
      <Link href={`/patients/${encounter.patientId}`} className="cta-btn secondary" style={{ marginTop: 12, maxWidth: 280 }}>
        View patient record
      </Link>
      <Link href="/" className="cta-btn secondary" style={{ maxWidth: 280, marginTop: 12 }}>
        Back to patients
      </Link>

      <ShareEncounterModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        encounterId={encounter.id}
        patientName={encounter.patient.fullName}
        patientPhone={encounter.patient.phoneNumber}
      />
    </div>
  );
}
