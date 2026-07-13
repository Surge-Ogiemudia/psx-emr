import type { Allergy } from "@/lib/types";

export default function AllergyBanner({ allergies }: { allergies: Allergy[] }) {
  if (allergies.length === 0) return null;

  return (
    <div className="alert-banner">
      <span className="alert-icon">⚠️</span>
      <div className="alert-text">
        <strong>ALLERGY ON FILE</strong>
        {allergies
          .map((a) => `${a.substance} · ${a.severity}${a.note ? ` (${a.note})` : ""}`)
          .join(" · ")}
      </div>
    </div>
  );
}
