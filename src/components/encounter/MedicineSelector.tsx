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
  const [matches, setMatches] = useState<{ name: string; defaultDose: string }[]>([]);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setMatches([]);
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

  function addMedicine(name: string, dose: string) {
    onChange([...medicines, { name, dose, qty: 1, interim }]);
    setQuery("");
    setShowResults(false);
  }

  function removeMedicine(index: number) {
    onChange(medicines.filter((_, i) => i !== index));
  }

  function updateQty(index: number, qty: number) {
    onChange(medicines.map((m, i) => (i === index ? { ...m, qty } : m)));
  }

  return (
    <div>
      {medicines.map((m, i) => (
        <div className="med-row" key={i}>
          <div>
            <div className="med-name">{m.name}</div>
            <div className="med-dose">
              {m.dose}
              {m.interim ? " (interim — pending diagnostic confirmation)" : ""}
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
                onClick={() => addMedicine(m.name, m.defaultDose)}
              >
                {m.name} <span style={{ color: "var(--muted)" }}>— {m.defaultDose}</span>
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
