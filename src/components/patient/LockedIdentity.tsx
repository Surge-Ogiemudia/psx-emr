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
        <div style={{
          width: "56px", height: "56px", borderRadius: "16px", flexShrink: 0,
          background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", fontWeight: 800, color: "white", boxShadow: "0 4px 14px rgba(236, 72, 153, 0.3)"
        }}>
          {getInitials(current.fullName)}
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
            {editing ? "Cancel" : "✎ Edit"}
          </button>
        )}
      </div>

      {editing && !locked ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Full name</label>
            <input
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "#0f766e"}
              onBlur={(e) => e.target.style.borderColor = "#e4e4e7"}
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
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Gender</label>
            <select
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }}
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>Address</label>
            <input
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "14px", outline: "none" }}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <button style={{ 
            background: "linear-gradient(135deg, #0f766e 0%, #06b6d4 100%)", color: "white", padding: "12px", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "8px" 
          }} disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {conditions.map((c, i) => (
            <span key={i} style={{ background: "#f3f4f6", color: "#52525b", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
              {c}
            </span>
          ))}
          {allergies.map((a, i) => (
            <span key={i} style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700 }}>
              ⚠ {a.substance} allergy
            </span>
          ))}
          {medications.map((m, i) => (
            <span key={i} style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
              {m.name} {m.dose}
            </span>
          ))}
          {conditions.length + allergies.length + medications.length === 0 && (
            <span style={{ fontSize: "12px", color: "#a1a1aa", fontStyle: "italic" }}>
              No known conditions, allergies, or medications on file.
            </span>
          )}
        </div>
      )}

      <button style={{ background: "none", border: "none", color: "#0f766e", fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: 0 }} onClick={toggleAudit}>
        {showAudit ? "Hide" : "View"} change history
      </button>

      {showAudit && (
        <div style={{ marginTop: "12px", padding: "12px", background: "#fafafa", borderRadius: "12px", border: "1px solid #f4f4f5" }}>
          {!auditLog || auditLog.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#a1a1aa" }}>No changes recorded yet.</div>
          ) : (
            auditLog.map((entry) => (
              <div key={entry.id} style={{ fontSize: "12px", color: "#52525b", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #e4e4e7" }}>
                <strong style={{ color: "#18181b" }}>{entry.fieldChanged}</strong> changed from{" "}
                <strong style={{ color: "#18181b" }}>{entry.oldValue || "—"}</strong> to{" "}
                <strong style={{ color: "#18181b" }}>{entry.newValue || "—"}</strong> by {entry.changedBy.fullName} ·{" "}
                <span style={{ color: "#a1a1aa" }}>{formatDateTime(entry.changedAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
