"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MedicineSelector from "./MedicineSelector";
import type { DispensedMedicine } from "@/lib/types";

const COMMON_AILMENTS = [
  "Headache",
  "Malaria",
  "Cough & Catarrh",
  "Body Pain",
  "Stomach Ache",
  "Diarrhea",
  "Fever",
  "Infection",
  "Skin Rash",
  "Eye Issue",
  "Typhoid",
  "Other",
];

export default function QuickDispenseForm() {
  const router = useRouter();

  // Patient (optional)
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  // Ailments
  const [selectedAilments, setSelectedAilments] = useState<string[]>([]);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherAilment, setOtherAilment] = useState("");

  // Medicines
  const [medicines, setMedicines] = useState<DispensedMedicine[]>([]);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAilment(ailment: string) {
    if (ailment === "Other") {
      setShowOtherInput(!showOtherInput);
      if (showOtherInput && otherAilment.trim()) {
        // Remove custom ailment when deselecting Other
        setSelectedAilments((prev) => prev.filter((a) => a !== otherAilment.trim()));
        setOtherAilment("");
      }
      return;
    }
    setSelectedAilments((prev) =>
      prev.includes(ailment) ? prev.filter((a) => a !== ailment) : [...prev, ailment]
    );
  }

  function addOtherAilment() {
    if (!otherAilment.trim()) return;
    if (!selectedAilments.includes(otherAilment.trim())) {
      setSelectedAilments((prev) => [...prev, otherAilment.trim()]);
    }
  }

  const allAilments = [
    ...selectedAilments,
    ...(showOtherInput && otherAilment.trim() && !selectedAilments.includes(otherAilment.trim())
      ? [otherAilment.trim()]
      : []),
  ];

  const canSubmit = allAilments.length > 0 && medicines.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    // Make sure "Other" text is included
    addOtherAilment();

    const finalAilments = [
      ...selectedAilments,
      ...(showOtherInput && otherAilment.trim() && !selectedAilments.includes(otherAilment.trim())
        ? [otherAilment.trim()]
        : []),
    ];

    try {
      const res = await fetch("/api/encounters/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim() || undefined,
          patientPhone: patientPhone.trim() || undefined,
          ailments: finalAilments,
          medicines: medicines.map((m) => ({
            name: m.name,
            dose: m.dose,
            qty: m.qty,
            productId: m.productId,
            price: m.price,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      // Navigate to done page with result data in query params
      const params = new URLSearchParams({
        patient: data.patientName || "Walk-in",
        ailments: data.ailments,
        count: String(data.medicinesCount),
      });
      router.push(`/encounter/quick/done?${params.toString()}`);
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "120px" }}>
      {/* Section 1: Patient (Optional) */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e4e4e7",
          padding: "20px",
          boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#18181b",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>👤</span> Patient
        </div>
        <div style={{ fontSize: "12px", color: "#71717a", marginBottom: "16px" }}>
          Optional — leave blank for anonymous walk-in
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #e4e4e7",
              background: "#f8fafc",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0ea5e9";
              e.target.style.background = "#ffffff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e4e4e7";
              e.target.style.background = "#f8fafc";
            }}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #e4e4e7",
              background: "#f8fafc",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0ea5e9";
              e.target.style.background = "#ffffff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e4e4e7";
              e.target.style.background = "#f8fafc";
            }}
          />
        </div>
      </div>

      {/* Section 2: Ailment */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e4e4e7",
          padding: "20px",
          boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#18181b",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🩺</span> What&apos;s the complaint?
        </div>
        <div style={{ fontSize: "12px", color: "#71717a", marginBottom: "16px" }}>
          Tap one or more ailments
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {COMMON_AILMENTS.map((ailment) => {
            const isSelected =
              ailment === "Other" ? showOtherInput : selectedAilments.includes(ailment);
            return (
              <button
                key={ailment}
                type="button"
                onClick={() => toggleAilment(ailment)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "20px",
                  border: isSelected ? "2px solid #0ea5e9" : "1px solid #e4e4e7",
                  background: isSelected
                    ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                    : "#f8fafc",
                  color: isSelected ? "#0369a1" : "#52525b",
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: isSelected ? "0 2px 8px rgba(14, 165, 233, 0.15)" : "none",
                }}
              >
                {ailment}
              </button>
            );
          })}
        </div>

        {showOtherInput && (
          <div style={{ marginTop: "12px" }}>
            <input
              type="text"
              autoFocus
              placeholder="Type ailment…"
              value={otherAilment}
              onChange={(e) => setOtherAilment(e.target.value)}
              onBlur={addOtherAilment}
              onKeyDown={(e) => {
                if (e.key === "Enter") addOtherAilment();
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid #0ea5e9",
                background: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxShadow: "0 0 0 3px rgba(14, 165, 233, 0.1)",
              }}
            />
          </div>
        )}

        {allAilments.length > 0 && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              background: "#f0fdf4",
              borderRadius: "10px",
              border: "1px solid #bbf7d0",
              fontSize: "13px",
              color: "#166534",
              fontWeight: 600,
            }}
          >
            Selected: {allAilments.join(", ")}
          </div>
        )}
      </div>

      {/* Section 3: Medicines */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e4e4e7",
          padding: "20px",
          boxShadow: "0 4px 20px -6px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#18181b",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>💊</span> Medicines
        </div>
        <MedicineSelector medicines={medicines} onChange={setMedicines} />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            color: "#dc2626",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: "16px",
          border: "none",
          background: canSubmit
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : "#e4e4e7",
          color: canSubmit ? "white" : "#a1a1aa",
          fontSize: "16px",
          fontWeight: 800,
          cursor: canSubmit ? "pointer" : "not-allowed",
          boxShadow: canSubmit ? "0 8px 24px -4px rgba(16, 185, 129, 0.4)" : "none",
          transition: "all 0.2s",
          opacity: submitting ? 0.7 : 1,
          letterSpacing: "-0.2px",
        }}
      >
        {submitting ? "Dispensing…" : "✓ Complete & Dispense"}
      </button>
    </div>
  );
}
