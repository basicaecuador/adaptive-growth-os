'use client'
// Full implementation in FASE 1 — requires Supabase Auth + TanStack Query

export interface CurrentUser {
  id: string
  email: string
  avatarUrl?: string
}

export function useCurrentUser() {
  return {
    user: null as CurrentUser | null,
    isLoading: false,
    error: null as Error | null,
  }
}
