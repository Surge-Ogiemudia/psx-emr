"use client";

import { useState } from "react";
import { initials, ageFromDob, formatDateTime } from "@/lib/format";
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

/** Active encounters lock this section to review-only (PRD Section 5.2). */
export default function LockedIdentity({
  patient,
  locked = false,
}: {
  patient: PatientIdentity;
  locked?: boolean;
}) {
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
    <div className="locked-header">
      <div className="lh-top">
        <div className="avatar lg">{initials(current.fullName)}</div>
        <div>
          <div className="lh-name">{current.fullName}</div>
          <div className="lh-sub">
            {current.gender ?? "—"} {age ? `· ${age}` : ""} · {current.phoneNumber}
          </div>
        </div>
        {locked ? (
          <span className="locked-pill">🔒 Locked</span>
        ) : (
          <button className="locked-pill" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel" : "✎ Edit"}
          </button>
        )}
      </div>

      {editing && !locked ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          <div className="field-group">
            <label className="field-label">Full name</label>
            <input
              className="field"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Phone number</label>
            <input
              className="field"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Gender</label>
            <select
              className="field"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Address</label>
            <input
              className="field"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <button className="cta-btn" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : (
        <div className="condition-tags" style={{ marginBottom: 10 }}>
          {conditions.map((c, i) => (
            <span key={i} className="condition-tag tag-condition">
              {c}
            </span>
          ))}
          {allergies.map((a, i) => (
            <span key={i} className="condition-tag tag-allergy">
              ⚠ {a.substance} allergy
            </span>
          ))}
          {medications.map((m, i) => (
            <span key={i} className="condition-tag tag-med">
              {m.name} {m.dose}
            </span>
          ))}
          {conditions.length + allergies.length + medications.length === 0 && (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              No known conditions, allergies, or medications on file.
            </span>
          )}
        </div>
      )}

      <button className="link-action" onClick={toggleAudit}>
        {showAudit ? "Hide" : "View"} change history
      </button>

      {showAudit && (
        <div style={{ marginTop: 8 }}>
          {!auditLog || auditLog.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--muted)" }}>No changes recorded yet.</div>
          ) : (
            auditLog.map((entry) => (
              <div className="audit-row" key={entry.id}>
                <strong>{entry.fieldChanged}</strong> changed from{" "}
                <strong>{entry.oldValue || "—"}</strong> to{" "}
                <strong>{entry.newValue || "—"}</strong> by {entry.changedBy.fullName} ·{" "}
                {formatDateTime(entry.changedAt)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
