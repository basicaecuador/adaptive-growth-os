import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentItem, ContentStatus } from '@/types/domain'
import type { GenerateContentRequest } from '@/types/api'

type ContentRow = {
  id: string
  brand_id: string
  plan_id: string | null
  created_by: string
  type: string
  platform: string
  status: string
  body: string
  notes: string | null
  image_url: string | null
  metadata: unknown
  created_at: string
  updated_at: string
}

function toContentItem(row: ContentRow): ContentItem {
  return {
    id: row.id,
    brandId: row.brand_id,
    planId: row.plan_id ?? '',
    type: row.type as ContentItem['type'],
    platform: row.platform as ContentItem['platform'],
    status: row.status as ContentItem['status'],
    body: row.body,
    notes: row.notes,
    imageUrl: row.image_url ?? null,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getContentItem(
  supabase: SupabaseClient,
  id: string,
): Promise<ContentItem> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return toContentItem(data as ContentRow)
}

export async function listContentByBrand(
  supabase: SupabaseClient,
  brandId: string,
): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => toContentItem(r as ContentRow))
}

export async function listContentByPlan(
  supabase: SupabaseClient,
  planId: string,
): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => toContentItem(r as ContentRow))
}

export async function createContentItem(
  supabase: SupabaseClient,
  input: {
    brandId: string
    createdBy: string
    type: string
    platform: string
    body: string
    notes?: string
    imageUrl?: string | null
  },
): Promise<ContentItem> {
  const { data, error } = await supabase
    .from('content_items')
    .insert({
      brand_id: input.brandId,
      created_by: input.createdBy,
      type: input.type,
      platform: input.platform,
      body: input.body,
      notes: input.notes ?? null,
      image_url: input.imageUrl ?? null,
      status: 'draft',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toContentItem(data as ContentRow)
}

export async function generateAndSaveContent(
  _supabase: SupabaseClient,
  _input: GenerateContentRequest,
): Promise<ContentItem> {
  throw new Error('Not implemented — use /api/content/generate route handler')
}

export async function updateContentStatus(
  supabase: SupabaseClient,
  id: string,
  status: ContentStatus,
): Promise<ContentItem> {
  const { data, error } = await supabase
    .from('content_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toContentItem(data as ContentRow)
}

export async function updateContentBody(
  supabase: SupabaseClient,
  id: string,
  body: string,
): Promise<ContentItem> {
  const { data, error } = await supabase
    .from('content_items')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toContentItem(data as ContentRow)
}
