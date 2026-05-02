// Implemented in FASE 5 — reporting and analytics
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ContentSummaryReport {
  brandId: string
  month: number
  year: number
  totalGenerated: number
  totalApproved: number
  totalRejected: number
  totalPublished: number
  approvalRate: number
}

export async function getContentSummary(
  _supabase: SupabaseClient,
  _brandId: string,
  _month: number,
  _year: number,
): Promise<ContentSummaryReport> {
  throw new Error('Not implemented — FASE 5')
}
