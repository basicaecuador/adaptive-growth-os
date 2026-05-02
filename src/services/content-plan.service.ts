// Implemented in FASE 2 — called by Route Handlers in app/api/content/
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentPlan } from '@/types/domain'
import type { ContentPlanInput } from '@/types/schemas/content.schema'

export async function getContentPlan(
  _supabase: SupabaseClient,
  _planId: string,
): Promise<ContentPlan> {
  throw new Error('Not implemented — FASE 2')
}

export async function listContentPlansByBrand(
  _supabase: SupabaseClient,
  _brandId: string,
): Promise<ContentPlan[]> {
  throw new Error('Not implemented — FASE 2')
}

export async function createContentPlan(
  _supabase: SupabaseClient,
  _input: ContentPlanInput,
): Promise<ContentPlan> {
  throw new Error('Not implemented — FASE 2')
}
