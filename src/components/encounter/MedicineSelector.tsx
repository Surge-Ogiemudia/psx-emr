"use client";

import { useState, useEffect } from "react";
import { searchInventory } from "@/app/encounter/actions";
import type { DispensedMedicine } from "@/lib/types";

export default function MedicineSelector({
  medicines,
  onChange,
  interim = false,
}: {
  medicines: DispensedMedicine[];
  onChange: (meds: DispensedMedicine[]) => void;
  interim?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [matches, setMatches] = useState<{ productId: string; name: string; defaultDose: string; retailPrice: number }[]>([]);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      // Defer state update to avoid cascading render lint error
      setTimeout(() => { if (active) setMatches([]); }, 0);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchInventory(query);
      if (active) {
        setMatches(results);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  function addMedicine(name: string, dose: string, productId: string, price: number) {
    onChange([...medicines, { name, dose, qty: 1, interim, productId, price }]);
    setQuery("");
    setShowResults(false);
  }

  function removeMedicine(index: number) {
    onChange(medicines.filter((_, i) => i !== index));
  }

  function updateQty(index: number, qty: number) {
    onChange(medicines.map((m, i) => (i === index ? { ...m, qty } : m)));
  }

  function updateDose(index: number, dose: string) {
    onChange(medicines.map((m, i) => (i === index ? { ...m, dose } : m)));
  }

  return (
    <div>
      {medicines.map((m, i) => (
        <div className="med-row" key={i}>
          <div>
            <div className="med-name">{m.name}</div>
            <div className="med-dose" style={{ marginTop: 4 }}>
              <input
                type="text"
                placeholder="Dosage instruction (e.g. 1 daily)"
                value={m.dose}
                onChange={(e) => updateDose(i, e.target.value)}
                style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              />
              {m.interim ? <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>* pending diagnostic confirmation</div> : null}
            </div>
          </div>
          <input
            type="number"
            min={1}
            value={m.qty}
            onChange={(e) => updateQty(i, Number(e.target.value))}
            style={{ width: 40, textAlign: "center", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }}
          />
          <span
            className={`med-qty ${m.interim ? "med-interim" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => removeMedicine(i)}
          >
            ×{m.qty} ✕
          </span>
        </div>
      ))}

      {showResults ? (
        <div style={{ marginTop: 8 }}>
          <input
            className="field"
            autoFocus
            placeholder="Search inventory…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 6 }}>
            {matches.map((m) => (
              <div
                key={m.name}
                className="hpc-option"
                style={{ display: "block", marginBottom: 4, cursor: "pointer" }}
                onClick={() => addMedicine(m.name, m.defaultDose, m.productId, m.retailPrice)}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{m.name}</span>
                  <span style={{ fontWeight: 500, color: "var(--primary)" }}>₦{m.retailPrice?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="link-action" style={{ marginTop: 8 }} onClick={() => setShowResults(true)}>
          + Add {interim ? "interim " : ""}medicine from inventory
        </div>
      )}
    </div>
  );
}
