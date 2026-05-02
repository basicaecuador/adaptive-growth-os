'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Organization } from '@/types/domain'

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/organizations')
      if (!res.ok) throw new Error('Error al cargar organizaciones')
      const { data } = await res.json()
      return data as Organization[]
    },
  })
}

export function useCreateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error?.message || 'Error al crear organización')
      }
      const { data } = await res.json()
      return data as Organization
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}
