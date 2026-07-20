"use client";

import { useEffect, useRef, useState } from "react";
import PatientRow, { type PatientRowData } from "./PatientRow";
import FaceScanner from "@/components/face/FaceScanner";
import { initials } from "@/lib/format";
import Link from "next/link";

export default function PatientListClient({
  initialPatients,
  autoFocusSearch = false,
}: {
  initialPatients: PatientRowData[];
  autoFocusSearch?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState(initialPatients);
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [faceMatches, setFaceMatches] = useState<any[]>([]);
  const [searchingFace, setSearchingFace] = useState(false);
  const [faceSearchError, setFaceSearchError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the redundant fetch on mount — the server already loaded this list.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setPatients(data.patients);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function handleFaceCapture({ embedding }: { embedding: number[]; photo: string }) {
    setSearchingFace(true);
    setFaceSearchError(null);
    setFaceMatches([]);
    try {
      const res = await fetch("/api/patients/face-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding })
      });
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        setFaceMatches(data.matches);
      } else {
        setFaceSearchError("No matching patient found.");
      }
    } catch (err) {
      console.error(err);
      setFaceSearchError("Face search failed. Please try again.");
    } finally {
      setSearchingFace(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)",
          borderRadius: "16px", filter: "blur(12px)", zIndex: 0
        }}></div>
        <div style={{ position: "relative", zIndex: 1, borderRadius: "14px", background: "linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%) border-box", border: "2px solid transparent", boxShadow: "0 8px 24px -4px rgba(14, 165, 233, 0.15)", display: "flex", alignItems: "center", padding: "4px 6px" }}>
          <span style={{ fontSize: "16px", color: "#6366f1", paddingLeft: "12px", paddingRight: "8px" }}>🔍</span>
          <input
            autoFocus={autoFocusSearch}
            placeholder="Search name or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: "10px 4px", fontSize: "14px", border: "none", outline: "none", background: "transparent", color: "#18181b" }}
          />
          <button onClick={() => {
            setShowFaceScanner(!showFaceScanner);
            setFaceMatches([]);
            setFaceSearchError(null);
          }} style={{ 
            background: "linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 100%)", 
            color: "#4338ca", 
            border: "none", 
            borderRadius: "10px", 
            padding: "8px 12px", 
            fontSize: "12px", 
            fontWeight: 700, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: "6px",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.1)"
          }}>
            📷 Face
          </button>
        </div>
      </div>

      {showFaceScanner && (
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
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink)" }}>Face Search</h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowFaceScanner(false);
                  setFaceMatches([]);
                  setFaceSearchError(null);
                }} 
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
                onCapture={(data) => {
                  handleFaceCapture(data);
                  setShowFaceScanner(false);
                }} 
              />
            </div>
            
            <p style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", margin: 0 }}>
              Align the patient's face inside the preview window.
            </p>
          </div>
        </div>
      )}

      {(searchingFace || faceSearchError || faceMatches.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px", marginBottom: "8px" }}>
          {searchingFace && (
            <div className="ai-processing">
              <div className="ai-dot" />
              <span className="ai-text">Matching face against patients...</span>
            </div>
          )}

          {faceSearchError && (
            <div className="alert-banner amber">
              <span className="alert-icon">ℹ️</span>
              <div className="alert-text">{faceSearchError}</div>
            </div>
          )}

          {faceMatches.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="section-header">Matches Found</div>
              {faceMatches.map((m) => (
                <Link
                  key={m.id}
                  href={`/patients/${m.id}`}
                  className="match-found"
                  style={{ textDecoration: "none", width: "100%" }}
                >
                  {m.photoUrl ? (
                    <img 
                      src={m.photoUrl} 
                      alt={m.fullName} 
                      style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} 
                    />
                  ) : (
                    <div className="match-avatar">{initials(m.fullName)}</div>
                  )}
                  <div className="match-info">
                    <div className="name">{m.fullName}</div>
                    <div className="sub">{m.phoneNumber} · {Math.round(m.score * 100)}% match</div>
                  </div>
                  <span className="match-confirm">Select patient →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", paddingLeft: "4px", marginTop: "8px" }}>
        {query ? `Results for "${query}"` : "Recent patients"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {patients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#a1a1aa", background: "#f4f4f5", borderRadius: "16px", border: "1px dashed #d4d4d8" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.5 }}>👥</div>
            <p style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>No patients found.</p>
          </div>
        ) : (
          patients.map((p) => <PatientRow key={p.id} patient={p} />)
        )}
      </div>
    </div>
  );
}
