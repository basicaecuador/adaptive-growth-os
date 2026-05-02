// Vector memory layer — implemented in FASE 4
// Requires: pgvector enabled in Supabase + embedding model configured

export interface MemoryEntry {
  id: string
  brandId: string
  type: 'content' | 'feedback' | 'rule' | 'learning'
  content: string
  embedding: number[] | null
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface MemorySearchResult {
  entry: MemoryEntry
  similarity: number
}

export async function searchMemory(
  _brandId: string,
  _query: string,
  _limit = 5,
): Promise<MemorySearchResult[]> {
  return []
}

export async function storeMemory(
  _entry: Omit<MemoryEntry, 'id' | 'embedding' | 'createdAt'>,
): Promise<void> {
  // No-op until FASE 4
}
