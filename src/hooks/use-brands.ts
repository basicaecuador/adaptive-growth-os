'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Brand } from '@/types/domain'

export function useBrands(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ['brands', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/brands?org_id=${orgId}`)
      if (!res.ok) throw new Error('Error al cargar marcas')
      const { data } = await res.json()
      return data as Brand[]
    },
    enabled: !!orgId,
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, organizationId }: { name: string; organizationId: string }) => {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organizationId }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error?.message || 'Error al crear marca')
      }
      const { data } = await res.json()
      return data as Brand
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['brands', data.organizationId] })
    },
  })
}
