// pgvector integration — implemented in FASE 4
// Enable with: NEXT_PUBLIC_ENABLE_VECTOR_MEMORY=true

export async function generateEmbedding(_text: string): Promise<number[]> {
  throw new Error('Vector memory not enabled — implement in FASE 4')
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vectors must have equal dimensions')
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0))
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0))
  return dot / (magA * magB)
}
