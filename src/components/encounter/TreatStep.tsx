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
  const [draftingNotes, setDraftingNotes] = useState(false);
  const [closing, setClosing] = useState(false);

  async function draftCounselling(meds: DispensedMedicine[]) {
    if (meds.length === 0) return;
    setDraftingNotes(true);
    const notes = await generateCounsellingNotes(meds);
    setCounselling(notes);
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
      <div className="card">
        <div className="card-title">💊 Medicines prescribed</div>
        <MedicineSelector medicines={medicines} onChange={handleMedicinesChange} />
      </div>

      <div className="card">
        <div className="card-title">🗣 Non-pharmacological advice</div>
        <textarea
          className="field complaint-full"
          style={{ color: "var(--ink)" }}
          placeholder="Rest, fluids, dietary advice…"
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="card-title">📅 Follow up</div>
        <textarea
          className="field"
          placeholder="Return date/condition, warning signs to watch for…"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="card-title">✦ Counselling notes (Gemma draft)</div>
        {draftingNotes ? (
          <div className="ai-processing">
            <div className="ai-dot" />
            <span className="ai-text">Drafting counselling notes…</span>
          </div>
        ) : (
          <textarea
            className="field"
            placeholder="Counselling notes appear here once medicines are added — edit freely."
            value={counselling}
            onChange={(e) => setCounselling(e.target.value)}
          />
        )}
      </div>

      <button className="cta-btn" disabled={medicines.length === 0 || closing} onClick={closeEncounter}>
        {closing ? "Ending session…" : "End Session, Finish"}
      </button>
    </>
  );
}
