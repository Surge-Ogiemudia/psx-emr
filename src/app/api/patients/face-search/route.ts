import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";
import { findTopMatches } from "@/lib/face-match";

export async function POST(req: NextRequest) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) {
    return NextResponse.json({ error: "No pharmacy found" }, { status: 400 });
  }

  const body = await req.json();
  if (!body.embedding || !Array.isArray(body.embedding)) {
    return NextResponse.json(
      { error: "embedding is required and must be an array" },
      { status: 400 }
    );
  }

  // Load all patients in this pharmacy that have a saved face embedding
  const patientsWithFaces = await prisma.patient.findMany({
    where: {
      pharmacyId: pharmacy.id,
      faceEmbedding: { not: null }
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      photoUrl: true,
      faceEmbedding: true
    }
  });

  // Convert schema strings back to numeric vectors
  const candidates = patientsWithFaces.map(p => {
    let parsedEmbedding: number[] = [];
    try {
      parsedEmbedding = JSON.parse(p.faceEmbedding!);
    } catch (e) {
      console.error(`Failed to parse embedding for patient ${p.id}:`, e);
    }
    return {
      id: p.id,
      fullName: p.fullName,
      phoneNumber: p.phoneNumber,
      photoUrl: p.photoUrl,
      embedding: parsedEmbedding
    };
  }).filter(c => c.embedding.length > 0);

  // We set a similarity threshold (e.g. 0.85). Tiny Face Detector descriptors have
  // different characteristics than full model descriptors, but cosine similarity
  // above 0.80 - 0.85 is typically a good match.
  const matches = findTopMatches(body.embedding, candidates, 3, 0.82);

  return NextResponse.json({ matches });
}
