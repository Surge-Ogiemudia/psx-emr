"use client";

import { useRouter } from "next/navigation";

export default function NewEncounterButton({ 
  patientId, 
  hasActiveEncounter 
}: { 
  patientId: string;
  hasActiveEncounter: boolean;
}) {
  const router = useRouter();

  const handleStartNew = () => {
    if (hasActiveEncounter) {
      const confirmNew = window.confirm(
        "There is already an active encounter in progress for this patient. Are you sure you want to start a new one instead of continuing it?"
      );
      if (!confirmNew) {
        return;
      }
    }
    router.push(`/encounter/new?patientId=${patientId}`);
  };

  return (
    <button onClick={handleStartNew} className="cta-btn w-full block text-center">
      + Start new encounter
    </button>
  );
}
