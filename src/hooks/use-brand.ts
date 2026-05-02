'use client'
// Full implementation in FASE 1 — requires TanStack Query + /api/brands
import type { Brand } from '@/types/domain'

export function useBrand(_brandId?: string) {
  return {
    brand: null as Brand | null,
    isLoading: false,
    error: null as Error | null,
  }
}
