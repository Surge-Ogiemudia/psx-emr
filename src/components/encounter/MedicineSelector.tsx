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
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {medicines.map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e4e4e7" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{m.name}</div>
            <div style={{ marginTop: "6px" }}>
              <input
                type="text"
                placeholder="Dosage instruction (e.g. 1 daily)"
                value={m.dose}
                onChange={(e) => updateDose(i, e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #e4e4e7", borderRadius: "8px", fontSize: "13px", outline: "none", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
                onBlur={(e) => e.target.style.borderColor = "#e4e4e7"}
              />
              {m.interim && <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px", fontWeight: 600 }}>* pending diagnostic confirmation</div>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <input
              type="number"
              min={1}
              value={m.qty}
              onChange={(e) => updateQty(i, Number(e.target.value))}
              style={{ width: "48px", textAlign: "center", padding: "6px", border: "1px solid #e4e4e7", borderRadius: "8px", fontSize: "13px", outline: "none", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
              onBlur={(e) => e.target.style.borderColor = "#e4e4e7"}
            />
            <button
              style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
              onMouseOver={(e) => e.currentTarget.style.background = "#fee2e2"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              onClick={() => removeMedicine(i)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {showResults ? (
        <div style={{ marginTop: "12px" }}>
          <input
            autoFocus
            placeholder="Search inventory…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #0ea5e9", background: "#ffffff", fontSize: "14px", outline: "none", boxShadow: "0 0 0 3px rgba(14, 165, 233, 0.1)" }}
          />
          <div style={{ maxHeight: "200px", overflowY: "auto", marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px", padding: "4px", background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            {matches.map((m) => (
              <button
                key={m.name}
                style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "transparent", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.background = "#f4f4f5"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                onClick={() => addMedicine(m.name, m.defaultDose, m.productId, m.retailPrice)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#18181b" }}>{m.name}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "2px 8px", borderRadius: "10px" }}>₦{m.retailPrice?.toLocaleString()}</span>
                </div>
              </button>
            ))}
            {query.trim() && matches.length === 0 && (
              <div style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>No matches found</div>
            )}
          </div>
        </div>
      ) : (
        <button
          style={{ width: "100%", marginTop: "12px", padding: "12px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", border: "1px dashed #7dd3fc", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(14, 165, 233, 0.15)"; e.currentTarget.style.borderColor = "#38bdf8"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "rgba(14, 165, 233, 0.1)"; e.currentTarget.style.borderColor = "#7dd3fc"; }}
          onClick={() => setShowResults(true)}
        >
          + Add {interim ? "interim " : ""}medicine from inventory
        </button>
      )}
    </div>
  );
}
