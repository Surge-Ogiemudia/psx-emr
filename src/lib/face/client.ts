/**
 * On-device face matching integration point.
 *
 * STUBBED FOR SCAFFOLD: capture and match are mocked. Swap for a real
 * face-api.js (or a maintained MediaPipe Face Landmarker) pipeline once
 * camera access is wired up. Everything must stay on-device — embeddings
 * are compared only against this pharmacy's own patient records
 * (scoped by pharmacy_id), never uploaded anywhere.
 *
 * Confidence threshold per PRD: >= 0.6 counts as a face-match signal.
 * If the camera is unavailable or no match clears the threshold, the face
 * signal is simply ignored — name/phone carry the full matching load.
 */

export const FACE_MATCH_THRESHOLD = 0.6;

export async function captureFaceEmbedding(
  _videoElement: HTMLVideoElement | null,
): Promise<number[] | null> {
  // TODO: run face-api.js detectSingleFace().withFaceLandmarks().withFaceDescriptor()
  return null;
}

export interface FaceCandidate {
  patientId: string;
  embedding: number[];
}

export function matchFace(
  _embedding: number[],
  _candidates: FaceCandidate[],
): { patientId: string; confidence: number } | null {
  // TODO: cosine/euclidean distance against candidates, return best match above threshold.
  return null;
}
