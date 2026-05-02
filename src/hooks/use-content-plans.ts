'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContentPlan, ContentPlanItem, PlanProduct } from '@/types/domain'

export function useContentPlans(brandId: string | null | undefined) {
  return useQuery({
    queryKey: ['content-plans', brandId],
    queryFn: async () => {
      const res = await fetch(`/api/content-plans?brand_id=${brandId}`)
      if (!res.ok) throw new Error('Error al cargar planes')
      const { data } = await res.json()
      return data as ContentPlan[]
    },
    enabled: !!brandId,
  })
}

export function useContentPlan(planId: string | null | undefined) {
  return useQuery({
    queryKey: ['content-plan', planId],
    queryFn: async () => {
      const res = await fetch(`/api/content-plans/${planId}`)
      if (!res.ok) throw new Error('Error al cargar el plan')
      const { data } = await res.json()
      return data as { plan: ContentPlan; items: ContentPlanItem[] }
    },
    enabled: !!planId,
  })
}

export function useCreateContentPlan(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      month: number
      year: number
      products: PlanProduct[]
      context?: string
    }) => {
      const res = await fetch('/api/content-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, ...input }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error?.message || body.error || 'Error al crear plan')
      }
      const { data } = await res.json()
      return data as ContentPlan
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-plans', brandId] })
    },
  })
}

export function useGenerateBrief(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { channelMix: string[]; funnelFocus: string; piecesCount: number }) => {
      const res = await fetch(`/api/content-plans/${planId}/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error?.message || body.error || 'Error al generar brief')
      }
      const { data } = await res.json()
      return data as ContentPlan
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-plan', planId] })
    },
  })
}

export function useUpdatePlan(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<ContentPlan>) => {
      const res = await fetch(`/api/content-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error?.message || body.error || 'Error al actualizar plan')
      }
      const { data } = await res.json()
      return data as ContentPlan
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-plan', planId] })
    },
  })
}

export function useGeneratePlan(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/content-plans/${planId}/generate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error?.message || body.error || 'Error al generar plan')
      }
      const { data } = await res.json()
      return data as ContentPlanItem[]
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-plan', planId] })
    },
  })
}

export function useUpdatePlanItem(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, patch }: { itemId: string; patch: Partial<ContentPlanItem> }) => {
      const res = await fetch(`/api/content-plans/${planId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error?.message || body.error || 'Error al actualizar')
      }
      const { data } = await res.json()
      return data as ContentPlanItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-plan', planId] })
    },
  })
}
