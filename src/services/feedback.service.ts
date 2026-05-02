// Implemented in FASE 3 — feedback collection and rule extraction
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Feedback } from '@/types/domain'

export async function createFeedback(
  _supabase: SupabaseClient,
  _feedback: Omit<Feedback, 'id' | 'createdAt'>,
): Promise<Feedback> {
  throw new Error('Not implemented — FASE 3')
}

export async function listFeedbackByContent(
  _supabase: SupabaseClient,
  _contentId: string,
): Promise<Feedback[]> {
  throw new Error('Not implemented — FASE 3')
}

export async function listFeedbackByBrand(
  _supabase: SupabaseClient,
  _brandId: string,
  _limit?: number,
): Promise<Feedback[]> {
  throw new Error('Not implemented — FASE 3')
}
