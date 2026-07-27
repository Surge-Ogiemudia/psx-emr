"use client";

import { useState } from "react";

export default function ShareEncounterModal({
  isOpen,
  onClose,
  encounterId,
  patientPhone,
  patientName,
}: {
  isOpen: boolean;
  onClose: () => void;
  encounterId: string;
  patientPhone?: string;
  patientName?: string;
}) {
  const [scope, setScope] = useState<"full" | "prescription" | "diagnostics" | "referral">("full");
  const [targetPhone, setTargetPhone] = useState(patientPhone || "");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareLink = `${baseUrl}/share/encounter/${encounterId}?scope=${scope}`;
  
  const shareText = `Hello ${patientName || "Patient"}, here is the view link for your clinical record from your pharmacy session:\n\n${shareLink}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function triggerWhatsApp() {
    const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  }

  function triggerEmail() {
    const mailUrl = `mailto:?subject=${encodeURIComponent("Your Clinical Record & Summary")}&body=${encodeURIComponent(shareText)}`;
    window.location.href = mailUrl;
  }

  function triggerSms() {
    const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(shareText)}`;
    window.location.href = smsUrl;
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "480px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#18181b" }}>📤 Send Record to Patient</h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#71717a" }}>✕</button>
        </div>

        {/* 1. Select Scope */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", fontWeight: 800, color: "#0F6E56", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            1. Select Content to Include:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              { id: "full", label: "Full Encounter" },
              { id: "prescription", label: "Prescription Only" },
              { id: "diagnostics", label: "Diagnostics Only" },
              { id: "referral", label: "Referral Note Only" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScope(opt.id as any)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: scope === opt.id ? "2px solid #0F6E56" : "1px solid #e4e4e7",
                  background: scope === opt.id ? "#E6F4F1" : "#ffffff",
                  color: scope === opt.id ? "#0F6E56" : "#475569",
                  fontWeight: scope === opt.id ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Recipient Phone */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", fontWeight: 800, color: "#0F6E56", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
            2. Recipient Phone / WhatsApp:
          </label>
          <input
            type="text"
            value={targetPhone}
            onChange={(e) => setTargetPhone(e.target.value)}
            placeholder="e.g. +2348012345678"
            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d4d4d8", fontSize: "14px" }}
          />
        </div>

        {/* 3. Direct Triggers */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", fontWeight: 800, color: "#0F6E56", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            3. Choose Channel to Send Web Link:
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="button"
              onClick={triggerWhatsApp}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#25D366", color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              💬 Send via WhatsApp
            </button>
            <button
              type="button"
              onClick={triggerEmail}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#0284c7", color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              ✉️ Send via Email
            </button>
            <button
              type="button"
              onClick={triggerSms}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#4f46e5", color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              📱 Send via Text Message (SMS)
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "#f4f4f5", color: "#18181b", fontWeight: 600, border: "1px solid #e4e4e7", cursor: "pointer", fontSize: "13px" }}
            >
              {copied ? "✓ View Link Copied!" : "📋 Copy Web Link to Clipboard"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>Done</button>
        </div>

      </div>
    </div>
  );
}
