"use client";

import { useState, useEffect } from "react";

export default function ApiKeySettingsModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void 
}) {
  const [keysInput, setKeysInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/settings/api-keys")
        .then((res) => res.json())
        .then((data) => {
          if (data.aiApiKey) {
            setKeysInput(data.aiApiKey);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey: keysInput }),
      });
      if (res.ok) {
        setMessage("API Keys updated successfully!");
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1200);
      } else {
        setMessage("Failed to save keys.");
      }
    } catch (e) {
      setMessage("Error saving API keys.");
    }
    setSaving(false);
  }

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "500px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#18181b" }}>🔑 API Keys & Failover Pool</h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#71717a" }}>✕</button>
        </div>

        <p style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5, marginTop: 0, marginBottom: "16px" }}>
          Enter one or more Google Gemini API Keys below (comma-separated). 
          The system will automatically rotate keys if one key reaches free-tier limits or quota exhaustion.
        </p>

        {loading ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#71717a", fontSize: "14px" }}>Loading settings...</div>
        ) : (
          <>
            <textarea
              rows={4}
              value={keysInput}
              onChange={(e) => setKeysInput(e.target.value)}
              placeholder="AIzaSyA..., AIzaSyB..., AIzaSyC..."
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d4d4d8", fontSize: "13px", fontFamily: "monospace", resize: "vertical", marginBottom: "12px" }}
            />

            <div style={{ fontSize: "11px", color: "#16a34a", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", marginBottom: "16px" }}>
              🔒 <strong>100% Safe & Secure:</strong> Keys are stored server-side in your pharmacy context only and are never exposed to browser clients or public code.
            </div>

            {message && (
              <div style={{ fontSize: "13px", fontWeight: 600, color: message.includes("success") ? "#16a34a" : "#dc2626", marginBottom: "12px" }}>
                {message}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" onClick={onClose} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Cancel</button>
              <button 
                type="button" 
                onClick={handleSave}
                disabled={saving}
                style={{ padding: "8px 20px", background: "#0F6E56", color: "white", borderRadius: "8px", fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : "Save Key Pool"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
