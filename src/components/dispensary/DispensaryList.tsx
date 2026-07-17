"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWalkInPatient } from "@/app/embed/dispensary/actions";

type Medicine = {
  name: string;
  dose?: string;
  qty?: number;
  interim?: boolean;
  productId?: string;
  price?: number;
};

type Prescription = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientPhoto: string | null;
  medicines: Medicine[];
  date: string;
  staffName: string;
  fulfilled: boolean;
};

export default function DispensaryList({
  prescriptions,
  walkIns = [],
  isEmbed = false,
  isWidget = false,
  pharmacyId,
}: {
  prescriptions: Prescription[];
  walkIns?: { id: string; fullName: string; phoneNumber: string }[];
  isEmbed?: boolean;
  isWidget?: boolean;
  pharmacyId?: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRx, setSelectedRx] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);
  const [walkInPhone, setWalkInPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      const resizeObserver = new ResizeObserver(() => {
        const height = document.body.scrollHeight;
        window.parent.postMessage({ type: "RESIZE_IFRAME", height }, "*");
      });
      resizeObserver.observe(document.body);
      return () => resizeObserver.disconnect();
    }
  }, [expandedId, prescriptions, search]);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handlePopulatePOS = (rx: Prescription) => {
    // If this is embedded in an iframe (like the POS), send the meds up to the parent
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({
        type: "POPULATE_CART",
        patientId: rx.patientId,
        patientName: rx.patientName,
        medicines: rx.medicines,
        encounterId: rx.id,
      }, "*");
    }
  };

  const handleDispense = async (id: string) => {
    await fetch(`/api/dispensary/${id}/dispense`, { method: "POST" });
    router.refresh(); // Refresh server component data
  };

  const pending = prescriptions.filter((p) => !p.fulfilled && (p.patientName.toLowerCase().includes(search.toLowerCase()) || p.patientPhone.includes(search)));
  const fulfilled = prescriptions.filter((p) => p.fulfilled && (p.patientName.toLowerCase().includes(search.toLowerCase()) || p.patientPhone.includes(search)));
  const matchedWalkIns = walkIns.filter((w) => w.fullName.toLowerCase().includes(search.toLowerCase()) || w.phoneNumber.includes(search));

  const handleCreateWalkIn = () => {
    if (!pharmacyId) return;
    const name = search.trim();
    if (!name) return;
    if (!creatingWalkIn) {
      setCreatingWalkIn(true);
      return;
    }
    startTransition(async () => {
      try {
        const newPatient = await createWalkInPatient(pharmacyId, name, walkInPhone.trim());
        handlePopulatePOS({
          id: `new-walkin-${newPatient.id}`,
          patientId: newPatient.id,
          patientName: newPatient.fullName,
          patientPhone: newPatient.phoneNumber,
          patientPhoto: null,
          medicines: [],
          date: new Date().toISOString(),
          staffName: "",
          fulfilled: false
        });
        setSearch("");
        setCreatingWalkIn(false);
        setWalkInPhone("");
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Reset creation state if search changes
  useEffect(() => {
    if (creatingWalkIn) {
      setCreatingWalkIn(false);
      setWalkInPhone("");
    }
  }, [search]);

  // Listen for successful POS checkout to automatically mark as dispensed
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "MARK_DISPENSED" && event.data.encounterId) {
        if (!event.data.encounterId.startsWith("walkin-") && !event.data.encounterId.startsWith("new-walkin-")) {
          handleDispense(event.data.encounterId);
        }
      }
    };
    
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  useEffect(() => {
    // Auto-refresh the list every 10 seconds for real-time updates
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  if (isEmbed) {
    return (
      <div style={{ width: "100%", position: "relative", fontFamily: "'Outfit', sans-serif", padding: isWidget ? "16px" : "0" }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
          .embed-input {
            width: 100%;
            border-radius: ${isWidget ? '0.75rem' : '0.5rem'};
            border: ${isWidget ? '2px solid transparent' : '1px solid #d4d4d8'};
            background: ${isWidget ? 'linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #0f766e 0%, #c026d3 100%) border-box' : '#fff'};
            padding: ${isWidget ? '0.65rem 1rem 0.65rem 2.25rem' : '0.5rem 0.75rem'};
            font-size: ${isWidget ? '0.85rem' : '0.875rem'};
            outline: none;
            box-sizing: border-box;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            color: #18181b;
            ${isWidget ? 'box-shadow: 0 4px 12px -2px rgba(15, 118, 110, 0.15);' : ''}
          }
          .embed-input:focus {
            box-shadow: ${isWidget ? '0 8px 16px -4px rgba(15, 118, 110, 0.25), 0 0 0 1px rgba(192, 38, 211, 0.3)' : '0 0 0 1px #0d9488'};
          }
          .embed-suggestions {
            margin-top: ${isWidget ? '0.5rem' : '0.25rem'};
            max-height: ${isWidget ? 'none' : '16rem'};
            overflow-y: ${isWidget ? 'visible' : 'auto'};
            border-radius: ${isWidget ? '0.75rem' : '0.5rem'};
            border: 1px solid #e4e4e7;
            background-color: #ffffff;
            box-shadow: ${isWidget ? '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'};
            display: flex;
            flex-direction: column;
            padding: ${isWidget ? '0.375rem 0' : '0'};
            gap: 0;
          }
          .embed-suggestion-section {
            padding: ${isWidget ? '0.5rem 0.5rem 0.25rem' : '0.25rem 0.75rem'};
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            color: #a1a1aa;
            background: transparent;
            border-bottom: ${isWidget ? 'none' : '1px solid #f4f4f5'};
            letter-spacing: 0.05em;
          }
          .embed-suggestion-btn {
            width: 100%;
            padding: ${isWidget ? '0.65rem 0.75rem' : '0.5rem 0.75rem'};
            text-align: left;
            font-size: 0.875rem;
            background: transparent;
            cursor: pointer;
            border: none;
            border-bottom: 1px solid #f4f4f5;
            border-radius: 0;
            transition: all 0.15s ease;
          }
          .embed-suggestion-btn:hover {
            background-color: ${isWidget ? '#f4f4f5' : '#f4f4f5'};
            ${isWidget ? 'transform: scale(0.995);' : ''}
          }
          .embed-suggestion-name {
            font-weight: 600;
            color: #27272a;
          }
          .embed-suggestion-meta {
            font-size: 0.75rem;
            color: #71717a;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .embed-create-btn {
            width: 100%;
            padding: 0.5rem 0.75rem;
            text-align: left;
            font-size: 0.875rem;
            background: #f0fdfa;
            color: #0f766e;
            font-weight: 600;
            cursor: pointer;
            border: none;
            border-top: 1px solid #ccfbf1;
          }
          .embed-create-btn:hover {
            background-color: #ccfbf1;
          }
          .embed-create-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}} />
        <div style={{ position: "relative" }}>
          {isWidget && (
            <svg 
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a1a1aa", width: "18px", height: "18px", pointerEvents: "none" }} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          <input
            type="text"
            placeholder={isWidget ? "Search patient or phone..." : "Search customer name or phone..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (selectedRx) setSelectedRx(null);
            }}
            className="embed-input"
          />
          {search && (
            <button 
              onClick={() => { setSearch(""); setSelectedRx(null); }}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", fontSize: "1.25rem", lineHeight: 1 }}
            >
              &times;
            </button>
          )}
        </div>
        
        {selectedRx ? (
          <div style={{ 
            marginTop: isWidget ? "0" : "0.5rem", 
            padding: "0.25rem 0", 
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {selectedRx.medicines.map((med: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", fontSize: "0.875rem", padding: "0.5rem 0.5rem", borderBottom: isWidget ? "1px solid #f4f4f5" : "none", background: isWidget ? "transparent" : "#fafafa", borderRadius: isWidget ? "0" : "0.375rem" }}>
                  <div style={{ fontWeight: 700, color: "#a1a1aa", marginTop: "1px", minWidth: "16px", fontSize: "0.8rem" }}>{i + 1}.</div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#27272a" }}>{med.name}</div>
                    <div style={{ display: "flex", gap: "0.5rem", color: "#52525b", fontSize: "0.75rem", marginTop: "0.35rem", alignItems: "center" }}>
                      {med.dose && <span style={{ background: "#fef3c7", color: "#92400e", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontWeight: 500 }}>{med.dose}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : ((isWidget || search) && (pending.length > 0 || (!isWidget && matchedWalkIns.length > 0) || search.trim().length > 0)) && (
          <div className="embed-suggestions">
            {pending.length > 0 && (
              <>
                {!isWidget && <div className="embed-suggestion-section">EMR Prescriptions</div>}
                {pending.map((rx, i) => (
                  <button
                    key={rx.id}
                    onClick={() => {
                      if (isWidget) {
                        setSelectedRx(rx);
                        setSearch(`${rx.patientName} (${rx.medicines.length} ${rx.medicines.length === 1 ? 'item' : 'items'})`);
                      } else {
                        handlePopulatePOS(rx);
                        setSearch("");
                      }
                    }}
                    className="embed-suggestion-btn"
                    style={isWidget ? { display: "flex", gap: "0.75rem", alignItems: "flex-start", borderBottom: i === pending.length - 1 ? "none" : "1px solid #f4f4f5" } : {}}
                  >
                    {isWidget && <div style={{ fontWeight: 700, color: "#a1a1aa", marginTop: "1px", minWidth: "16px", fontSize: "0.8rem" }}>{i + 1}.</div>}
                    <div style={isWidget ? { display: "flex", flexDirection: "column", flex: 1 } : {}}>
                      <div className="embed-suggestion-name">{rx.patientName}</div>
                      <div className="embed-suggestion-meta">{rx.patientPhone} &middot; {rx.medicines.length} {rx.medicines.length === 1 ? (isWidget ? 'item' : 'pending item') : (isWidget ? 'items' : 'pending items')}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
            
            {isWidget && pending.length === 0 && (
              <div style={{ padding: "1rem", fontSize: "0.875rem", color: "#a1a1aa", textAlign: "center" }}>
                No prescriptions found matching "{search}"
              </div>
            )}
            
            {(!isWidget && matchedWalkIns.length > 0) && (
              <>
                <div className="embed-suggestion-section">Walk-in Customers</div>
                {matchedWalkIns.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => { 
                      handlePopulatePOS({
                        id: `walkin-${w.id}`,
                        patientId: w.id,
                        patientName: w.fullName,
                        patientPhone: w.phoneNumber,
                        patientPhoto: null,
                        medicines: [],
                        date: new Date().toISOString(),
                        staffName: "",
                        fulfilled: false
                      }); 
                      setSearch(""); 
                    }}
                    className="embed-suggestion-btn"
                  >
                    <div className="embed-suggestion-name">{w.fullName}</div>
                    <div className="embed-suggestion-meta">{w.phoneNumber}</div>
                  </button>
                ))}
              </>
            )}

            {(!isWidget && search.trim().length > 0) && (
              <div style={{ borderTop: "1px solid #ccfbf1", background: "#f0fdfa" }}>
                {!creatingWalkIn ? (
                  <button 
                    onClick={handleCreateWalkIn}
                    disabled={isPending}
                    className="embed-create-btn"
                    style={{ borderTop: "none" }}
                  >
                    + Add "{search.trim()}" as new Walk-in
                  </button>
                ) : (
                  <div style={{ padding: "0.5rem 0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      type="tel"
                      placeholder="Enter phone number..."
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      className="embed-input"
                      style={{ flex: 1, padding: "0.25rem 0.5rem" }}
                      autoFocus
                    />
                    <button
                      onClick={handleCreateWalkIn}
                      disabled={isPending || !walkInPhone.trim()}
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "#0f766e",
                        color: "white",
                        borderRadius: "0.25rem",
                        border: "none",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: isPending || !walkInPhone.trim() ? "not-allowed" : "pointer",
                        opacity: (isPending || !walkInPhone.trim()) ? 0.6 : 1
                      }}
                    >
                      {isPending ? "Adding..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dispensary-list">
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search customer name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
        />
      </div>

      {prescriptions.length === 0 && (
        <div className="dispensary-empty" style={{ marginTop: 0 }}>
          <div className="dispensary-empty-icon">💊</div>
          <p>No prescriptions yet</p>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <div className="dispensary-section-label">
            <span className="dispensary-dot pending" />
            Pending ({pending.length})
          </div>
          {pending.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              rx={rx}
              expanded={expandedId === rx.id}
              onToggle={() => toggle(rx.id)}
              onPopulate={() => handlePopulatePOS(rx)}
              onDispense={() => handleDispense(rx.id)}
            />
          ))}
        </>
      )}

      {fulfilled.length > 0 && (
        <>
          <div className="dispensary-section-label" style={{ marginTop: pending.length > 0 ? 20 : 0 }}>
            <span className="dispensary-dot fulfilled" />
            Fulfilled ({fulfilled.length})
          </div>
          {fulfilled.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              rx={rx}
              expanded={expandedId === rx.id}
              onToggle={() => toggle(rx.id)}
              onPopulate={() => handlePopulatePOS(rx)}
              onDispense={() => handleDispense(rx.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function PrescriptionCard({
  rx,
  expanded,
  onToggle,
  onPopulate,
  onDispense,
}: {
  rx: Prescription;
  expanded: boolean;
  onToggle: () => void;
  onPopulate: () => void;
  onDispense: () => void;
}) {
  const initials = rx.patientName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = getTimeAgo(rx.date);

  const handleClickHeader = () => {
    onToggle();
    if (!rx.fulfilled) {
      onPopulate(); // Only populate if it's not fulfilled yet
    }
  };

  return (
    <div className={`dispensary-card ${rx.fulfilled ? "fulfilled" : ""}`}>
      <button className="dispensary-card-header" onClick={handleClickHeader}>
        <div className="dispensary-avatar">
          {rx.patientPhoto ? (
            <img src={rx.patientPhoto} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="dispensary-info">
          <div className="dispensary-name">{rx.patientName}</div>
          <div className="dispensary-phone">{rx.patientPhone}</div>
        </div>
        <div className="dispensary-meta">
          <div className="dispensary-pills">{rx.medicines.length} 💊</div>
          <div className="dispensary-time">{timeAgo}</div>
        </div>
        <div className={`dispensary-chevron ${expanded ? "open" : ""}`}>▾</div>
      </button>

      {expanded && (
        <div className="dispensary-medicines">
          {rx.medicines.map((med, i) => (
            <div key={i} className="dispensary-med-row">
              <div className="dispensary-med-name">{med.name}</div>
              <div className="dispensary-med-detail">
                {med.dose && <span>{med.dose}</span>}
                {med.qty && <span> · Qty: {med.qty}</span>}
                {med.interim && <span className="dispensary-interim-badge">Interim</span>}
              </div>
            </div>
          ))}
          <div className="dispensary-prescriber">
            Prescribed by {rx.staffName}
          </div>
          
          {!rx.fulfilled && (
            <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button 
                className="cta-btn" 
                style={{ background: "var(--green-mid)", color: "white", padding: "8px 16px", borderRadius: "8px", fontSize: "12px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDispense();
                }}
              >
                ✓ Dispense
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
