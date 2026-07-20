const STEPS = [
  "Identification",
  "Complaint",
  "HPC",
  "History",
  "Review of Systems",
  "Assessment",
  "Management",
];

export default function StepProgress({ step }: { step: number }) {
  return (
    <div style={{ padding: "16px 20px", background: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 40, marginBottom: "16px" }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        {STEPS.map((_, i) => {
          const isActive = i + 1 === step;
          const isDone = i + 1 < step;
          return (
            <div
              key={i}
              style={{
                height: "6px",
                flex: 1,
                borderRadius: "3px",
                background: isActive ? "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" : isDone ? "#a7f3d0" : "#f4f4f5",
                transition: "all 0.3s ease",
                boxShadow: isActive ? "0 2px 8px rgba(99, 102, 241, 0.4)" : "none",
              }}
            />
          );
        })}
      </div>
      <div style={{ fontSize: "12px", color: "#52525b", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Step {step} of {STEPS.length}</span>
        <strong style={{ color: "#18181b", fontSize: "13px", letterSpacing: "-0.2px" }}>{STEPS[step - 1]}</strong>
      </div>
    </div>
  );
}
