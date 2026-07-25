"use client";

import { useEffect, useRef, useState } from "react";
import PatientRow, { type PatientRowData } from "./PatientRow";
import FaceScanner from "@/components/face/FaceScanner";
import { initials } from "@/lib/format";
import Link from "next/link";

export default function PatientListClient({
  initialPatients,
  autoFocusSearch = false,
  stats,
}: {
  initialPatients: PatientRowData[];
  autoFocusSearch?: boolean;
  stats?: { total: number; pending: number; allergies: number };
}) {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState(initialPatients);
  const [activeFilter, setActiveFilter] = useState<"all" | "encounters" | "pending" | "allergies">("all");
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

  const displayedPatients = patients.filter((p) => {
    if (activeFilter === "encounters") {
      return p.encounters && p.encounters.length > 0;
    }
    if (activeFilter === "pending") {
      return p.encounters && p.encounters[0]?.status === "diagnostic_pending";
    }
    if (activeFilter === "allergies") {
      try {
        const list = JSON.parse(p.knownAllergies || "[]");
        return list.length > 0;
      } catch {
        return false;
      }
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Search Input Bar with Face Scanner Trigger */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(13, 148, 136, 0.15) 100%)",
          borderRadius: "18px", filter: "blur(12px)", zIndex: 0
        }}></div>
        <div style={{ position: "relative", zIndex: 1, borderRadius: "16px", background: "#ffffff", border: "1.5px solid #e4e4e7", boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.06)", display: "flex", alignItems: "center", padding: "4px 6px" }}>
          <span style={{ fontSize: "16px", color: "#0d9488", paddingLeft: "12px", paddingRight: "8px" }}>🔍</span>
          <input
            autoFocus={autoFocusSearch}
            placeholder="Search patient name, phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: "12px 4px", fontSize: "14px", fontWeight: 500, border: "none", outline: "none", background: "transparent", color: "#18181b" }}
          />
          <button onClick={() => {
            setShowFaceScanner(!showFaceScanner);
            setFaceMatches([]);
            setFaceSearchError(null);
          }} style={{ 
            background: "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)", 
            color: "#ffffff", 
            border: "none", 
            borderRadius: "12px", 
            padding: "8px 14px", 
            fontSize: "12px", 
            fontWeight: 700, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: "6px",
            boxShadow: "0 4px 12px rgba(13, 148, 136, 0.25)",
            transition: "transform 0.2s"
          }}>
            <span>📷</span>
            <span>Face ID</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "4px",
        scrollbarWidth: "none"
      }}>
        <button
          onClick={() => setActiveFilter("all")}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeFilter === "all" ? "none" : "1px solid #e4e4e7",
            background: activeFilter === "all" ? "#0f766e" : "#ffffff",
            color: activeFilter === "all" ? "#ffffff" : "#71717a",
            boxShadow: activeFilter === "all" ? "0 4px 12px rgba(15, 118, 110, 0.25)" : "none",
            whiteSpace: "nowrap"
          }}
        >
          All Patients
        </button>

        <button
          onClick={() => setActiveFilter("encounters")}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeFilter === "encounters" ? "none" : "1px solid #e4e4e7",
            background: activeFilter === "encounters" ? "#0284c7" : "#ffffff",
            color: activeFilter === "encounters" ? "#ffffff" : "#71717a",
            boxShadow: activeFilter === "encounters" ? "0 4px 12px rgba(2, 132, 199, 0.25)" : "none",
            whiteSpace: "nowrap"
          }}
        >
          Recent Visits
        </button>

        <button
          onClick={() => setActiveFilter("pending")}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeFilter === "pending" ? "none" : "1px solid #e4e4e7",
            background: activeFilter === "pending" ? "#d97706" : "#ffffff",
            color: activeFilter === "pending" ? "#ffffff" : "#71717a",
            boxShadow: activeFilter === "pending" ? "0 4px 12px rgba(217, 119, 6, 0.25)" : "none",
            whiteSpace: "nowrap"
          }}
        >
          Pending Diagnostics {stats?.pending ? `(${stats.pending})` : ""}
        </button>

        <button
          onClick={() => setActiveFilter("allergies")}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeFilter === "allergies" ? "none" : "1px solid #e4e4e7",
            background: activeFilter === "allergies" ? "#dc2626" : "#ffffff",
            color: activeFilter === "allergies" ? "#ffffff" : "#71717a",
            boxShadow: activeFilter === "allergies" ? "0 4px 12px rgba(220, 38, 38, 0.25)" : "none",
            whiteSpace: "nowrap"
          }}
        >
          Known Allergies {stats?.allergies ? `(${stats.allergies})` : ""}
        </button>
      </div>

      {showFaceScanner && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
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
            borderRadius: "24px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.35)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f766e" }}>Biometric Face Search</h3>
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
              borderRadius: "18px", 
              overflow: "hidden",
              border: "2px solid #0d9488"
            }}>
              <FaceScanner 
                onCapture={(data) => {
                  handleFaceCapture(data);
                  setShowFaceScanner(false);
                }} 
              />
            </div>
            
            <p style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", margin: 0, fontWeight: 500 }}>
              Align the patient's face inside the camera preview window.
            </p>
          </div>
        </div>
      )}

      {(searchingFace || faceSearchError || faceMatches.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px", marginBottom: "8px" }}>
          {searchingFace && (
            <div className="ai-processing">
              <div className="ai-dot" />
              <span className="ai-text">Matching face against patient database...</span>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "4px", marginTop: "4px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71717a" }}>
          {query ? `Search results (${displayedPatients.length})` : `Patient List (${displayedPatients.length})`}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {displayedPatients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#a1a1aa", background: "#ffffff", borderRadius: "20px", border: "1px dashed #d4d4d8", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.6 }}>📁</div>
            <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#3f3f46" }}>No matching patients found.</p>
            <p style={{ fontSize: "13px", color: "#a1a1aa", marginTop: "4px" }}>Try adjusting your search query or active filter.</p>
          </div>
        ) : (
          displayedPatients.map((p) => <PatientRow key={p.id} patient={p} />)
        )}
      </div>
    </div>
  );
}
