'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { BrandSetup } from '@/types/domain'

type BrandDetail = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  fontUrl: string | null
  primaryColor: string
} & BrandSetup

export function useBrandDetail(brandId: string | null | undefined) {
  return useQuery({
    queryKey: ['brand-detail', brandId],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${brandId}`)
      if (!res.ok) throw new Error('Error al cargar la marca')
      const { data } = await res.json()
      return data as BrandDetail
    },
    enabled: !!brandId,
  })
}

export function useUpdateBrandSetup(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (setup: Omit<BrandSetup, 'brandId' | 'updatedAt'>) => {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setup),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error?.message || 'Error al guardar')
      }
      const { data } = await res.json()
      return data as BrandSetup
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand-detail', brandId] })
    },
  })
}
