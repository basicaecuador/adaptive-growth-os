'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { BrandMember, UserRole } from '@/types/domain'

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text()
    if (!text) return `${fallback} (HTTP ${res.status})`
    try {
      const body = JSON.parse(text)
      return body.error?.message || (typeof body.error === 'string' ? body.error : null) || fallback
    } catch {
      return text.slice(0, 200) || fallback
    }
  } catch {
    return fallback
  }
}

export function useBrandMembers(brandId: string | null | undefined) {
  return useQuery({
    queryKey: ['brand-members', brandId],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${brandId}/members`)
      if (!res.ok) throw new Error('Error al cargar miembros')
      const { data } = await res.json()
      return data as BrandMember[]
    },
    enabled: !!brandId,
  })
}

export function useAddBrandMember(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; role: UserRole }) => {
      const res = await fetch(`/api/brands/${brandId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error(await parseError(res, 'Error al agregar miembro'))
      const { data } = await res.json()
      return data as BrandMember
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand-members', brandId] })
    },
  })
}

export function useUpdateBrandMemberRole(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: UserRole }) => {
      const res = await fetch(`/api/brands/${brandId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error(await parseError(res, 'Error al actualizar rol'))
      const { data } = await res.json()
      return data as BrandMember
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand-members', brandId] })
    },
  })
}

export function useRemoveBrandMember(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/brands/${brandId}/members/${memberId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await parseError(res, 'Error al eliminar miembro'))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand-members', brandId] })
    },
  })
}
