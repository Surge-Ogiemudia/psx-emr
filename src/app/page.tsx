import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import Link from "next/link";
import FooterDisclaimer from "@/components/layout/FooterDisclaimer";
import PatientListClient from "@/components/patient/PatientListClient";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy, requireEmrAccess } from "@/lib/tenant";

export default async function HomePage() {
  await requireEmrAccess();
  const pharmacy = await getCurrentPharmacy();

  const patients = pharmacy
    ? await prisma.patient.findMany({
        where: { pharmacyId: pharmacy.id },
        orderBy: { lastVisitAt: "desc" },
        include: {
          encounters: {
            orderBy: { encounterDate: "desc" },
            take: 1,
            include: { complaint: true },
          },
        },
      })
    : [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayEncountersCount = patients.reduce((count, p) => {
    const enc = p.encounters[0];
    if (enc && new Date(enc.encounterDate) >= startOfToday) {
      return count + 1;
    }
    return count;
  }, 0);

  const pendingDiagnosticsCount = patients.reduce((count, p) => {
    const enc = p.encounters[0];
    if (enc && enc.status === "diagnostic_pending") {
      return count + 1;
    }
    return count;
  }, 0);

  const patientsWithAllergiesCount = patients.reduce((count, p) => {
    try {
      const list = JSON.parse(p.knownAllergies || "[]");
      return list.length > 0 ? count + 1 : count;
    } catch {
      return count;
    }
  }, 0);

  return (
    <AppShell>
      <TopBar
        title={`${pharmacy?.name || "Pharmacy"}`}
        subtitle={`${patients.length} active patient records in clinical system`}
      />
      
      <div className="screen-content" style={{ paddingBottom: "100px" }}>
        {/* Metric Summary Widgets */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "10px",
          marginBottom: "8px"
        }}>
          <div style={{
            background: "#ffffff",
            padding: "12px 14px",
            borderRadius: "16px",
            border: "1px solid #e4e4e7",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "2px"
          }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Patients</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#0f766e" }}>{patients.length}</span>
              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>Active</span>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "12px 14px",
            borderRadius: "16px",
            border: "1px solid #e4e4e7",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "2px"
          }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Visits Today</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#0284c7" }}>{todayEncountersCount}</span>
              <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: 600 }}>Encounters</span>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "12px 14px",
            borderRadius: "16px",
            border: "1px solid #e4e4e7",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "2px"
          }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending Lab/Rx</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: pendingDiagnosticsCount > 0 ? "#d97706" : "#71717a" }}>{pendingDiagnosticsCount}</span>
              <span style={{ fontSize: "11px", color: "#d97706", fontWeight: 600 }}>Action req.</span>
            </div>
          </div>
        </div>

        <PatientListClient 
          initialPatients={JSON.parse(JSON.stringify(patients))} 
          stats={{
            total: patients.length,
            pending: pendingDiagnosticsCount,
            allergies: patientsWithAllergiesCount
          }}
        />
      </div>
      <FooterDisclaimer />
      
      {/* Floating Action Dock */}
      <div style={{ 
        position: "fixed", 
        bottom: "max(20px, env(safe-area-inset-bottom))", 
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex", 
        alignItems: "center",
        gap: "10px", 
        zIndex: 50,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(16px)",
        padding: "8px 12px",
        borderRadius: "40px",
        border: "1px solid rgba(228, 228, 231, 0.8)",
        boxShadow: "0 12px 36px -8px rgba(0, 0, 0, 0.15)"
      }}>
        <Link href="/dispensary" style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: "13px",
          padding: "10px 18px",
          borderRadius: "24px",
          boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          textDecoration: "none",
          transition: "transform 0.2s"
        }}>
          <span>💊</span>
          <span>Dispensary</span>
        </Link>
        
        <Link href="/encounter/new" style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: "13px",
          padding: "10px 20px",
          borderRadius: "24px",
          boxShadow: "0 4px 16px rgba(13, 148, 136, 0.4)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          textDecoration: "none",
          transition: "transform 0.2s"
        }}>
          <span style={{ fontSize: "16px", lineHeight: 1 }}>＋</span>
          <span>New Encounter</span>
        </Link>
      </div>
    </AppShell>
  );
}
