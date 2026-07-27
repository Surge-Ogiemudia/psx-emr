"use client";

import { useState, useEffect } from "react";

export default function ApiKeysClient() {
  const [keysInput, setKeysInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

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
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("Failed to save keys.");
      }
    } catch (e) {
      setMessage("Error saving API keys.");
    }
    setSaving(false);
  }

  return (
    <div style={{ background: "#ffffff", borderRadius: "24px", padding: "32px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)", marginTop: "24px" }}>
      <p style={{ fontSize: "15px", color: "#52525b", lineHeight: 1.6, marginTop: 0, marginBottom: "24px" }}>
        Enter one or more Google Gemini API Keys below (comma-separated). 
        The system will automatically rotate keys if one key reaches free-tier limits or quota exhaustion.
      </p>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#71717a", fontSize: "15px", fontWeight: 500 }}>
          Loading API keys...
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#18181b", marginBottom: "8px" }}>
              Active API Keys
            </label>
            <textarea
              rows={6}
              value={keysInput}
              onChange={(e) => setKeysInput(e.target.value)}
              placeholder="AIzaSyA..., AIzaSyB..., AIzaSyC..."
              style={{ 
                width: "100%", 
                padding: "16px", 
                borderRadius: "12px", 
                border: "2px solid #e4e4e7", 
                fontSize: "14px", 
                fontFamily: "monospace", 
                resize: "vertical", 
                boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
              onBlur={(e) => e.target.style.borderColor = "#e4e4e7"}
            />
          </div>

          <div style={{ 
            fontSize: "13px", 
            color: "#166534", 
            background: "#f0fdf4", 
            padding: "16px", 
            borderRadius: "12px", 
            marginBottom: "24px",
            border: "1px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <span style={{ fontSize: "20px" }}>🔒</span>
            <div>
              <strong>100% Safe & Secure:</strong> Keys are stored server-side in your pharmacy context only and are never exposed to browser clients or public code.
            </div>
          </div>

          {message && (
            <div style={{ 
              fontSize: "14px", 
              fontWeight: 600, 
              color: message.includes("success") ? "#15803d" : "#b91c1c", 
              background: message.includes("success") ? "#dcfce7" : "#fee2e2",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
              border: `1px solid ${message.includes("success") ? "#bbf7d0" : "#fecaca"}`
            }}>
              {message}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              type="button" 
              onClick={handleSave}
              disabled={saving}
              style={{ 
                padding: "12px 32px", 
                background: "linear-gradient(135deg, #0f766e 0%, #0284c7 100%)", 
                color: "white", 
                borderRadius: "12px", 
                fontWeight: 800, 
                fontSize: "15px",
                border: "none", 
                cursor: saving ? "not-allowed" : "pointer", 
                opacity: saving ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.3)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseOver={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(15, 118, 110, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(15, 118, 110, 0.3)";
                }
              }}
            >
              {saving ? "Saving Changes..." : "Save Key Pool"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
