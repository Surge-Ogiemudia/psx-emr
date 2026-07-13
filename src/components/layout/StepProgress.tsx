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
    <div className="step-progress">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`step-dot ${
            i + 1 === step ? "active" : i + 1 < step ? "done" : ""
          }`}
        />
      ))}
      <span className="step-label">
        Step <strong>{step}</strong> of {STEPS.length} · {STEPS[step - 1]}
      </span>
    </div>
  );
}
