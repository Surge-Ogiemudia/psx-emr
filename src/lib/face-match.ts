/**
 * Calculates the cosine similarity between two 128D vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

interface Candidate {
  id: string;
  fullName: string;
  phoneNumber: string;
  photoUrl: string | null;
  embedding: number[];
}

/**
 * Finds top N matches above a given threshold.
 */
export function findTopMatches(
  queryEmbedding: number[],
  patients: Candidate[],
  topN = 3,
  threshold = 0.85
) {
  const matches = patients
    .map(p => {
      const score = cosineSimilarity(queryEmbedding, p.embedding);
      return {
        id: p.id,
        fullName: p.fullName,
        phoneNumber: p.phoneNumber,
        photoUrl: p.photoUrl,
        score
      };
    })
    .filter(m => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return matches;
}
