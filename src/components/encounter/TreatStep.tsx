"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MedicineSelector from "./MedicineSelector";
import { generateCounsellingNotes } from "@/lib/ai/client";
import type { DispensedMedicine } from "@/lib/types";

export default function TreatStep({ encounterId }: { encounterId: string }) {
  const router = useRouter();
  const [medicines, setMedicines] = useState<DispensedMedicine[]>([]);
  const [advice, setAdvice] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [counselling, setCounselling] = useState("");
  const [counsellingError, setCounsellingError] = useState<string | null>(null);
  const [draftingNotes, setDraftingNotes] = useState(false);
  const [closing, setClosing] = useState(false);

  async function draftCounselling(meds: DispensedMedicine[]) {
    if (meds.length === 0) return;
    setDraftingNotes(true);
    setCounsellingError(null);
    const res = await generateCounsellingNotes(meds);
    if (res.error) {
      setCounsellingError(res.error);
    } else if (res.notes) {
      setCounselling(res.notes);
    }
    setDraftingNotes(false);
  }

  function handleMedicinesChange(meds: DispensedMedicine[]) {
    setMedicines(meds);
    draftCounselling(meds);
  }

  async function closeEncounter() {
    setClosing(true);
    await fetch(`/api/encounters/${encounterId}/management-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exitType: "treated",
        medicinesDispensed: medicines,
        nonPharmacologicalAdvice: advice || null,
        followUpInstructions: followUp || null,
        counsellingNotes: counselling || null,
      }),
    });
    router.push(`/encounter/${encounterId}/done`);
  }

  return (
    <>
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>💊</span> Medicines prescribed
        </div>
        <MedicineSelector medicines={medicines} onChange={handleMedicinesChange} />
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🗣</span> Non-pharmacological advice
        </div>
        <textarea
          style={{ width: "100%", minHeight: "100px", padding: "16px", borderRadius: "12px", border: "1px solid #e4e4e7", background: "#f8fafc", fontSize: "14px", lineHeight: 1.5, color: "#18181b", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
          onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#ffffff"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.background = "#f8fafc"; }}
          placeholder="Rest, fluids, dietary advice…"
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
        />
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px", marginBottom: "16px", boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📅</span> Follow up
        </div>
        <textarea
          style={{ width: "100%", minHeight: "80px", padding: "16px", borderRadius: "12px", border: "1px solid #e4e4e7", background: "#f8fafc", fontSize: "14px", lineHeight: 1.5, color: "#18181b", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
          onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.background = "#ffffff"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.background = "#f8fafc"; }}
          placeholder="Return date/condition, warning signs to watch for…"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
        />
      </div>

      {(draftingNotes || (counselling && !counsellingError)) && (
        <div style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderRadius: "16px", border: "1px solid #e9d5ff", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 20px -6px rgba(147, 51, 234, 0.15)" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#9333ea", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>✦</span> Patient Counselling Notes
          </div>
          {draftingNotes ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#ffffff", borderRadius: "12px", color: "#7e22ce" }}>
              <div className="ai-dot" />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Structuring counselling notes…</span>
            </div>
          ) : (
            <textarea
              style={{ width: "100%", minHeight: "120px", padding: "16px", borderRadius: "12px", border: "1px solid #d8b4fe", background: "#ffffff", fontSize: "14px", lineHeight: 1.5, color: "#4c1d95", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
              onFocus={(e) => { e.target.style.borderColor = "#a855f7"; e.target.style.boxShadow = "0 0 0 3px rgba(168, 85, 247, 0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#d8b4fe"; e.target.style.boxShadow = "none"; }}
              placeholder="Counselling notes appear here once medicines are added — edit freely."
              value={counselling}
              onChange={(e) => setCounselling(e.target.value)}
            />
          )}
        </div>
      )}

      <button style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: medicines.length > 0 ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
        color: medicines.length > 0 ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
        cursor: medicines.length > 0 ? "pointer" : "not-allowed", boxShadow: medicines.length > 0 ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
        transition: "all 0.2s", opacity: closing ? 0.7 : 1
      }} disabled={medicines.length === 0 || closing} onClick={closeEncounter}>
        {closing ? "Ending session…" : "End Session, Finish"}
      </button>
    </>
  );
}
