import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { 
      referredTo, 
      reason, 
      urgency,
      complaintSummary,
      pharmacistImpression,
      historySnapshot
    } = await req.json();

    if (!referredTo || !reason) {
      return NextResponse.json({ error: "Referral destination and reason are required." }, { status: 400 });
    }

    const today = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    const urgencyLabel = urgency ? urgency.toUpperCase() : "ROUTINE";

    // Clean template formatting
    let letter = `DATE: ${today}
TO: ${referredTo}
URGENCY LEVEL: ${urgencyLabel}

RE: CLINICAL REFERRAL & TRANSFER OF CARE

Dear Healthcare Team / Dr. at ${referredTo},

Please accept this referral for further medical evaluation and management.

REASON FOR REFERRAL:
${reason}

CHIEF COMPLAINT & PRESENTING SYMPTOMS:
${complaintSummary || "Patient presented for community pharmacy consultation."}

CLINICAL IMPRESSION & FINDINGS:
${pharmacistImpression || "Further evaluation requested per reason above."}
`;

    if (historySnapshot?.bloodPressure || historySnapshot?.temperature || historySnapshot?.weight || historySnapshot?.pulse) {
      letter += `\nVITALS AT PRESENTATION:
- BP: ${historySnapshot.bloodPressure || 'N/A'}
- Temp: ${historySnapshot.temperature ? `${historySnapshot.temperature}°C` : 'N/A'}
- Pulse: ${historySnapshot.pulse ? `${historySnapshot.pulse} bpm` : 'N/A'}
- Weight: ${historySnapshot.weight ? `${historySnapshot.weight} kg` : 'N/A'}
`;
    }

    letter += `\nThank you for your prompt assistance with this patient.

Sincerely,
Attending Clinical Pharmacist`;

    return NextResponse.json({ letter });
  } catch (error: any) {
    console.error("Referral generation error:", error);
    return NextResponse.json({ error: "Failed to generate referral letter" }, { status: 500 });
  }
}
