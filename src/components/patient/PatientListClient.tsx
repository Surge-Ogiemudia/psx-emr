"use client";

import { useEffect, useRef, useState } from "react";
import PatientRow, { type PatientRowData } from "./PatientRow";

export default function PatientListClient({
  initialPatients,
  autoFocusSearch = false,
}: {
  initialPatients: PatientRowData[];
  autoFocusSearch?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState(initialPatients);
  const [faceStub, setFaceStub] = useState(false);
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

  return (
    <>
      <div className="search-bar">
        <span className="icon">🔍</span>
        <input
          autoFocus={autoFocusSearch}
          placeholder="Search name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="face-btn" onClick={() => setFaceStub(true)}>
          📷 Face
        </button>
      </div>

      {faceStub && (
        <div className="face-capture">
          <span className="scan-icon">👤</span>
          <span className="scan-text">
            Face search runs on-device once camera access is wired in
          </span>
          <div className="face-scanning" />
        </div>
      )}

      <div className="section-header">
        {query ? `Results for "${query}"` : "Recent patients"}
      </div>

      {patients.length === 0 ? (
        <div className="empty-state">No patients found.</div>
      ) : (
        patients.map((p) => <PatientRow key={p.id} patient={p} />)
      )}
    </>
  );
}
