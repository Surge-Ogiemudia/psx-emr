"use client";

import { useState } from "react";
import { initials as getInitials, ageFromDob, formatDateTime } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type { Allergy, Medication } from "@/lib/types";

export interface PatientIdentity {
  id: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  photoUrl?: string | null;
  knownAllergies: string;
  chronicConditions: string;
  currentMedications: string;
}

interface AuditEntry {
  id: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedBy: { fullName: string };
}

export default function LockedIdentity({ patient, locked = false }: { patient: PatientIdentity; locked?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(patient);

  const [form, setForm] = useState({
    fullName: patient.fullName,
    phoneNumber: patient.phoneNumber,
    gender: patient.gender ?? "",
    address: patient.address ?? "",
    photoUrl: patient.photoUrl ?? "",
  });

  const allergies = parseJson<Allergy[]>(current.knownAllergies, []);
  const conditions = parseJson<string[]>(current.chronicConditions, []);
  const medications = parseJson<Medication[]>(current.currentMedications, []);
  const age = ageFromDob(current.dateOfBirth);

  async function loadAudit() {
    const res = await fetch(`/api/patients/${patient.id}/audit-log`);
    const data = await res.json();
    setAuditLog(data.logs);
  }

  async function toggleAudit() {
    if (!showAudit && !auditLog) await loadAudit();
    setShowAudit((v) => !v);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/patients/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCurrent((c) => ({ ...c, ...data.patient }));
    setSaving(false);
    setEditing(false);
    if (showAudit) loadAudit();
  }

  return (
    <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e4e4e7", padding: "20px", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.06)", marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        
        {/* Patient Photo Avatar (captured face or initials fallback) */}
        <div style={{ position: "relative" }}>
          {current.photoUrl ? (
            <img
              src={current.photoUrl}
              alt={current.fullName}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                objectFit: "cover",
                border: "2px solid #0F6E56",
                boxShadow: "0 4px 14px rgba(15, 110, 86, 0.2)",
              }}
            />
          ) : (
            <div style={{
              width: "60px", height: "60px", borderRadius: "16px", flexShrink: 0,
              background: "linear-gradient(135deg, #0F6E56 0%, #0d9488 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", fontWeight: 800, color: "white", boxShadow: "0 4px 14px rgba(15, 110, 86, 0.2)"
            }}>
              {getInitials(current.fullName)}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#18181b", letterSpacing: "-0.5px" }}>{current.fullName}</div>
          <div style={{ fontSize: "13px", color: "#71717a", marginTop: "2px", fontWeight: 500 }}>
            {current.gender ?? "—"} {age ? `· ${age}` : ""} · {current.phoneNumber}
          </div>
        </div>

        {locked ? (
          <span style={{ background: "#f3f4f6", color: "#71717a", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            🔒 Locked
          </span>
        ) : (
          <button style={{ 
            background: editing ? "#fee2e2" : "#f0fdfa", color: editing ? "#b91c1c" : "#0f766e", 
            border: "none", padding: "8px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" 
          }} onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel" : "✎ Edit Identity"}
          </button>
        )}
      </div>

      {editing && !locked ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Full name</label>
            <input
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Phone number</label>
            <input
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }}
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Photo URL (Captured Face)</label>
            <input
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }}
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ background: "#0f766e", color: "white", border: "none", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Allergies, Conditions, Medications Summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#e11d48", textTransform: "uppercase", marginBottom: "4px" }}>⚠️ Known Allergies</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: allergies.length > 0 ? "#18181b" : "#71717a" }}>
            {allergies.length > 0 ? allergies.map(a => a.substance).join(", ") : "Nil"}
          </div>
        </div>

        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#0284c7", textTransform: "uppercase", marginBottom: "4px" }}>🩺 Chronic Conditions</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: conditions.length > 0 ? "#18181b" : "#71717a" }}>
            {conditions.length > 0 ? conditions.join(", ") : "Nil"}
          </div>
        </div>

        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", marginBottom: "4px" }}>💊 Current Medications</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: medications.length > 0 ? "#18181b" : "#71717a" }}>
            {medications.length > 0 ? medications.map(m => `${m.name} (${m.dose})`).join(", ") : "Nil"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={toggleAudit}
          style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
        >
          {showAudit ? "Hide Audit History" : "📜 View Audit History"}
        </button>
      </div>

      {showAudit && (
        <div style={{ marginTop: "16px", background: "#f8fafc", borderRadius: "12px", padding: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#334155", marginBottom: "8px", textTransform: "uppercase" }}>Audit Trail</div>
          {!auditLog ? (
            <div style={{ fontSize: "13px", color: "#64748b" }}>Loading logs...</div>
          ) : auditLog.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#64748b" }}>No edits recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {auditLog.map((log) => (
                <div key={log.id} style={{ fontSize: "12px", color: "#475569", borderBottom: "1px dashed #cbd5e1", paddingBottom: "6px" }}>
                  <strong>{log.fieldChanged}</strong> updated from <em>{log.oldValue || "empty"}</em> to <strong>{log.newValue}</strong> by {log.changedBy?.fullName || "Staff"} on {formatDateTime(log.changedAt)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
