import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type { HpcAnswer, RosAnswerEntry, DispensedMedicine, ReferralDetails } from "@/lib/types";

export default async function SharedEncounterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { id } = await params;
  const { scope = "full" } = await searchParams;

  const encounter = await prisma.encounter.findUnique({
    where: { id },
    include: {
      patient: true,
      staff: { select: { fullName: true } },
      complaint: true,
      hpcs: true,
      historySnapshot: true,
      ros: true,
      assessment: true,
      managementPlan: true,
    },
  });

  if (!encounter) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, fontFamily: "sans-serif", textAlign: "center" }}>
        <h2>Record Not Found</h2>
        <p>This clinical record link is invalid or may have expired.</p>
      </div>
    );
  }

  const { patient, staff, complaint, hpcs, historySnapshot, ros, assessment, managementPlan } = encounter;
  const showFull = scope === "full";
  const showPrescription = showFull || scope === "prescription";
  const showDiagnostics = showFull || scope === "diagnostics";
  const showReferral = showFull || scope === "referral";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#0f172a" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        
        {/* Header */}
        <div style={{ borderBottom: "2px solid #0F6E56", paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ background: "#E6F4F1", color: "#0F6E56", fontWeight: 800, padding: "4px 10px", borderRadius: 6, fontSize: 11, textTransform: "uppercase" }}>
                Patient Clinical Copy
              </span>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 0 0", color: "#0f172a" }}>
                {scope === "prescription" ? "Prescription & Medication Summary" : scope === "diagnostics" ? "Diagnostic Test Requisition" : scope === "referral" ? "Official Referral Letter" : "Complete Encounter Record"}
              </h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{formatDateTime(encounter.encounterDate)}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Provider: {staff?.fullName || "Clinical Staff"}</div>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 24, border: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Patient Details</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{patient.fullName}</div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>Contact: {patient.phoneNumber} | Gender: {patient.gender || "Not specified"}</div>
        </div>

        {/* Prescription Scope */}
        {showPrescription && managementPlan?.exitType === "treated" && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#8b5cf6", marginBottom: 12 }}>💊 Prescribed Medications</h3>
            <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 12, padding: 16 }}>
              {(() => {
                const meds = parseJson<DispensedMedicine[]>(managementPlan.medicinesDispensed, []);
                if (meds.length === 0) return <div style={{ fontSize: 14, color: "#64748b" }}>No medications prescribed.</div>;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {meds.map((m, i) => (
                      <div key={i} style={{ background: "#ffffff", padding: "10px 14px", borderRadius: 8, border: "1px solid #d8b4fe", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, color: "#6d28d9" }}>{m.name} ({m.dose})</span>
                        <span style={{ fontWeight: 600, color: "#4c1d95" }}>Qty: {m.qty}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {managementPlan.counsellingNotes && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", marginBottom: 4 }}>Instructions & Advice:</div>
                  <div style={{ fontSize: 14, color: "#334155", background: "#ffffff", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
                    {managementPlan.counsellingNotes}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnostics Scope */}
        {showDiagnostics && managementPlan?.exitType === "diagnostic" && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0ea5e9", marginBottom: 12 }}>🧪 Required Laboratory & Diagnostic Orders</h3>
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: 16 }}>
              {(() => {
                const diags = parseJson<string[]>(managementPlan.diagnosticsRecommended, []);
                if (diags.length === 0) return <div style={{ fontSize: 14, color: "#64748b" }}>No diagnostic orders.</div>;
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {diags.map((d, i) => (
                      <div key={i} style={{ background: "#ffffff", color: "#0369a1", padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 700, border: "1px solid #7dd3fc" }}>
                        ✓ {d}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Referral Scope */}
        {showReferral && managementPlan?.exitType === "referred" && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#4338ca", marginBottom: 12 }}>📋 Official Referral Letter</h3>
            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: 16, whiteSpace: "pre-wrap", fontFamily: "serif", fontSize: 14, lineHeight: 1.6, color: "#1e1b4b" }}>
              {managementPlan.counsellingNotes || "Referral note requested."}
            </div>
          </div>
        )}

        {/* Full Encounter Details */}
        {showFull && (
          <>
            {complaint && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F6E56", marginBottom: 6 }}>1. Chief Complaint</h4>
                <div style={{ fontSize: 14, color: "#334155" }}>{complaint.textInput || complaint.gemmaSummary || "Recorded"}</div>
              </div>
            )}

            {historySnapshot && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F6E56", marginBottom: 6 }}>2. Vitals</h4>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#334155" }}>
                  <span>BP: <strong>{historySnapshot.bloodPressure || "N/A"}</strong></span>
                  <span>Temp: <strong>{historySnapshot.temperature ? `${historySnapshot.temperature}°C` : "N/A"}</strong></span>
                  <span>Pulse: <strong>{historySnapshot.pulse ? `${historySnapshot.pulse} bpm` : "N/A"}</strong></span>
                  <span>Weight: <strong>{historySnapshot.weight ? `${historySnapshot.weight} kg` : "N/A"}</strong></span>
                </div>
              </div>
            )}

            {assessment && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F6E56", marginBottom: 6 }}>3. Assessment</h4>
                <div style={{ fontSize: 14, color: "#334155", whiteSpace: "pre-wrap" }}>{assessment.pharmacistImpression}</div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginTop: 32, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
          Issued by Community Pharmacy EMR • View-only patient copy
        </div>

      </div>
    </div>
  );
}
