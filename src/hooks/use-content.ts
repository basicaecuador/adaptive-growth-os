'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContentItem } from '@/types/domain'

export function useContent(brandId: string | null | undefined) {
  return useQuery({
    queryKey: ['content', brandId],
    queryFn: async () => {
      const res = await fetch(`/api/content?brand_id=${brandId}`)
      if (!res.ok) throw new Error('Error al cargar contenido')
      const { data } = await res.json()
      return data as ContentItem[]
    },
    enabled: !!brandId,
  })
}

export function useGenerateContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      brandId: string
      platform: string
      type: string
      topic: string
    }) => {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error?.message || 'Error al generar contenido')
      }
      const { data } = await res.json()
      return data as ContentItem
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['content', data.brandId] })
    },
  })
}
