"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initials, formatRelative } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type { Allergy } from "@/lib/types";

interface PatientMatch {
  id: string;
  fullName: string;
  phoneNumber: string;
  lastVisitAt: string | null;
  knownAllergies: string;
}

export default function IdentificationStep({ skipToPatientId }: { skipToPatientId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<"idle" | "strong" | "weak" | "none">("idle");
  const [matched, setMatched] = useState<PatientMatch | null>(null);
  const [candidates, setCandidates] = useState<PatientMatch[]>([]);
  const [creating, setCreating] = useState(false);
  const [starting] = useState(() => Boolean(skipToPatientId));

  useEffect(() => {
    if (!skipToPatientId) return;
    startEncounter(skipToPatientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipToPatientId]);

  const hasQuery = Boolean(name.trim() || phone.trim());

  useEffect(() => {
    if (skipToPatientId || !hasQuery) return;
    const handle = setTimeout(async () => {
      const res = await fetch("/api/patients/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (data.result === "strong") {
        setResult("strong");
        setMatched(data.patient);
      } else if (data.result === "weak") {
        setResult("weak");
        setCandidates(data.candidates);
      } else {
        setResult("none");
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [name, phone, skipToPatientId, hasQuery]);

  const effectiveResult = hasQuery ? result : "idle";

  async function startEncounter(patientId: string) {
    const res = await fetch("/api/encounters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId }),
    });
    const data = await res.json();
    router.push(`/encounter/${data.encounter.id}/complaint`);
  }

  async function createPatient() {
    setCreating(true);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: name, phoneNumber: phone }),
    });
    const data = await res.json();
    router.push(`/encounter/new/consent?patientId=${data.patient.id}`);
  }

  if (starting) {
    return <div className="ai-processing"><div className="ai-dot" /><span className="ai-text">Starting encounter…</span></div>;
  }

  return (
    <>
      <div className="face-capture">
        <span className="scan-icon">👤</span>
        <span className="scan-text">Align face in frame</span>
        <div className="face-scanning" />
      </div>

      <div className="field-group">
        <label className="field-label">Full name</label>
        <input
          className="field"
          placeholder="Type patient's name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="field-label">Phone number</label>
        <input
          className="field"
          placeholder="+234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {effectiveResult === "strong" && matched && (
        <>
          <div className="match-found">
            <div className="match-avatar">{initials(matched.fullName)}</div>
            <div className="match-info">
              <div className="name">{matched.fullName}</div>
              <div className="sub">
                {matched.lastVisitAt ? `Last visit ${formatRelative(matched.lastVisitAt)}` : "First visit"}
                {(() => {
                  const allergies = parseJson<Allergy[]>(matched.knownAllergies, []);
                  return allergies.length > 0 ? ` · ⚠ ${allergies[0].substance} allergy` : "";
                })()}
              </div>
            </div>
          </div>
          <button className="cta-btn" onClick={() => startEncounter(matched.id)}>
            Continue with this patient
          </button>
        </>
      )}

      {effectiveResult === "weak" && candidates.length > 0 && (
        <>
          <div className="section-header">Possible matches — confirm visually</div>
          {candidates.map((c) => (
            <button
              key={c.id}
              className="match-found"
              style={{ width: "100%", cursor: "pointer" }}
              onClick={() => startEncounter(c.id)}
            >
              <div className="match-avatar">{initials(c.fullName)}</div>
              <div className="match-info">
                <div className="name">{c.fullName}</div>
                <div className="sub">{c.phoneNumber}</div>
              </div>
              <span className="match-confirm">This is her/him →</span>
            </button>
          ))}
        </>
      )}

      {effectiveResult === "none" && (
        <>
          <div className="alert-banner amber">
            <span className="alert-icon">ℹ️</span>
            <div className="alert-text">
              <strong>No match found</strong>
              This looks like a new patient. Confirm details to continue.
            </div>
          </div>
          <button className="cta-btn" disabled={creating || !name.trim() || !phone.trim()} onClick={createPatient}>
            {creating ? "Creating…" : "Create new patient"}
          </button>
        </>
      )}
    </>
  );
}
