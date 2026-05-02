'use client'
// Full implementation in FASE 1 — requires TanStack Query + /api/organizations
import type { Organization } from '@/types/domain'

export function useOrganization(_orgId?: string) {
  return {
    organization: null as Organization | null,
    isLoading: false,
    error: null as Error | null,
  }
}
