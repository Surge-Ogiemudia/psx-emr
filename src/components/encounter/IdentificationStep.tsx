"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initials, formatRelative } from "@/lib/format";
import { parseJson } from "@/lib/types";
import type { Allergy } from "@/lib/types";
import FaceScanner from "@/components/face/FaceScanner";

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
  
  // Face capture state
  const [photo, setPhoto] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [openScanner, setOpenScanner] = useState(false);

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
      body: JSON.stringify({ 
        fullName: name, 
        phoneNumber: phone,
        faceEmbedding: embedding ? JSON.stringify(embedding) : undefined,
        photoUrl: photo || undefined
      }),
    });
    const data = await res.json();
    router.push(`/encounter/new/consent?patientId=${data.patient.id}`);
  }

  if (starting) {
    return <div className="ai-processing"><div className="ai-dot" /><span className="ai-text">Starting encounter…</span></div>;
  }

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        {photo ? (
          <div style={{
            position: "relative",
            borderRadius: "16px",
            height: "90px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "12px",
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)"
          }}>
            <img src={photo} alt="Captured Face" style={{ height: "64px", width: "64px", borderRadius: "12px", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ background: "#d1fae5", padding: "2px", borderRadius: "50%" }}>✓</span> Face Captured
              </span>
              <button 
                type="button" 
                onClick={() => { setPhoto(null); setEmbedding(null); }}
                style={{
                  alignSelf: "flex-start", padding: "6px 12px", borderRadius: "8px",
                  background: "#f4f4f5", border: "none", fontSize: "12px", fontWeight: "600",
                  cursor: "pointer", color: "#52525b", transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#e4e4e7"}
                onMouseOut={(e) => e.currentTarget.style.background = "#f4f4f5"}
              >
                Retake
              </button>
            </div>
          </div>
        ) : (
          <button 
            type="button"
            onClick={() => setOpenScanner(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              fontWeight: "700", cursor: "pointer", background: "linear-gradient(to right, #faf5ff, #f3e8ff)",
              color: "#9333ea", padding: "16px", borderRadius: "16px", border: "1px dashed #d8b4fe",
              transition: "all 0.2s", fontSize: "15px"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.background = "#f3e8ff"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#d8b4fe"; e.currentTarget.style.background = "linear-gradient(to right, #faf5ff, #f3e8ff)"; }}
          >
            <span style={{ fontSize: "20px" }}>📷</span> Capture Patient Face
          </button>
        )}
      </div>

      {openScanner && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div className="card" style={{
            width: "100%",
            maxWidth: "360px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink)" }}>Face Enrollment</h3>
              <button 
                type="button" 
                onClick={() => setOpenScanner(false)} 
                style={{ fontSize: "18px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ 
              width: "100%", 
              aspectRatio: "1 / 1", 
              borderRadius: "14px", 
              overflow: "hidden",
              border: "1.5px solid var(--border)"
            }}>
              <FaceScanner 
                onCapture={({ embedding, photo }) => {
                  setEmbedding(embedding);
                  setPhoto(photo);
                  setOpenScanner(false);
                }} 
              />
            </div>
            
            <p style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", margin: 0 }}>
              Align the patient's face inside the preview window.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#71717a", textTransform: "uppercase", paddingLeft: "4px" }}>Full name</label>
        <input
          style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid #e4e4e7", background: "#ffffff", fontSize: "15px", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s" }}
          onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.boxShadow = "0 0 0 3px rgba(14, 165, 233, 0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.boxShadow = "none"; }}
          placeholder="Type patient's name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#71717a", textTransform: "uppercase", paddingLeft: "4px" }}>Phone number</label>
        <input
          style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid #e4e4e7", background: "#ffffff", fontSize: "15px", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s" }}
          onFocus={(e) => { e.target.style.borderColor = "#0ea5e9"; e.target.style.boxShadow = "0 0 0 3px rgba(14, 165, 233, 0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.boxShadow = "none"; }}
          placeholder="+234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {effectiveResult === "strong" && matched && (
        <>
          <div style={{ background: "linear-gradient(to right, #f0fdfa, #ccfbf1)", borderRadius: "16px", padding: "16px", border: "1px solid #99f6e4", display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)" }}>
              {initials(matched.fullName)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#064e3b" }}>{matched.fullName}</div>
              <div style={{ fontSize: "13px", color: "#047857", marginTop: "4px" }}>
                {matched.lastVisitAt ? `Last visit ${formatRelative(matched.lastVisitAt)}` : "First visit"}
                {(() => {
                  const allergies = parseJson<Allergy[]>(matched.knownAllergies, []);
                  return allergies.length > 0 ? ` · ⚠ ${allergies[0].substance} allergy` : "";
                })()}
              </div>
            </div>
          </div>
          <button style={{
            width: "100%", padding: "16px", borderRadius: "16px", border: "none",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer",
            boxShadow: "0 8px 24px -4px rgba(16, 185, 129, 0.4)", transition: "all 0.2s"
          }} onClick={() => startEncounter(matched.id)}>
            Continue with this patient
          </button>
        </>
      )}

      {effectiveResult === "weak" && candidates.length > 0 && (
        <>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#71717a", textTransform: "uppercase", marginBottom: "12px", paddingLeft: "4px" }}>Possible matches — confirm visually</div>
          {candidates.map((c) => (
            <button
              key={c.id}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "16px", padding: "16px",
                borderRadius: "16px", border: "1px solid #e4e4e7", background: "#ffffff",
                cursor: "pointer", marginBottom: "12px", transition: "all 0.2s", textAlign: "left",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(14, 165, 233, 0.1)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e4e4e7"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)"; }}
              onClick={() => startEncounter(c.id)}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f4f4f5", color: "#52525b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800 }}>
                {initials(c.fullName)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#18181b" }}>{c.fullName}</div>
                <div style={{ fontSize: "13px", color: "#71717a", marginTop: "2px" }}>{c.phoneNumber}</div>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#0ea5e9", background: "#f0f9ff", padding: "6px 12px", borderRadius: "20px" }}>This is her/him →</span>
            </button>
          ))}
        </>
      )}

      {effectiveResult === "none" && (
        <>
          <div style={{ background: "linear-gradient(to right, #fffbeb, #fef3c7)", borderRadius: "16px", padding: "16px", border: "1px solid #fde68a", display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "24px" }}>
            <span style={{ fontSize: "20px" }}>ℹ️</span>
            <div>
              <strong style={{ display: "block", fontSize: "14px", color: "#b45309", marginBottom: "4px" }}>No match found</strong>
              <span style={{ fontSize: "13px", color: "#92400e" }}>This looks like a new patient. Confirm details to continue.</span>
            </div>
          </div>
          <button style={{
            width: "100%", padding: "16px", borderRadius: "16px", border: "none",
            background: (name.trim() && phone.trim()) ? "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)" : "#e4e4e7",
            color: (name.trim() && phone.trim()) ? "white" : "#a1a1aa", fontSize: "15px", fontWeight: 700,
            cursor: (name.trim() && phone.trim()) ? "pointer" : "not-allowed", boxShadow: (name.trim() && phone.trim()) ? "0 8px 24px -4px rgba(79, 70, 229, 0.4)" : "none",
            transition: "all 0.2s", opacity: creating ? 0.7 : 1
          }} disabled={creating || !name.trim() || !phone.trim()} onClick={createPatient}>
            {creating ? "Creating…" : "Create new patient"}
          </button>
        </>
      )}
    </>
  );
}
