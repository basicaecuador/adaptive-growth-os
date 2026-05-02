// Implemented in FASE 3 — brand rule management
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Rule, RuleSet } from '@/types/domain'

export async function getRuleSetForBrand(
  _supabase: SupabaseClient,
  _brandId: string,
): Promise<RuleSet> {
  throw new Error('Not implemented — FASE 3')
}

export async function createRule(
  _supabase: SupabaseClient,
  _rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Rule> {
  throw new Error('Not implemented — FASE 3')
}

export async function toggleRule(
  _supabase: SupabaseClient,
  _ruleId: string,
  _isActive: boolean,
): Promise<Rule> {
  throw new Error('Not implemented — FASE 3')
}

export async function deleteRule(
  _supabase: SupabaseClient,
  _ruleId: string,
): Promise<void> {
  throw new Error('Not implemented — FASE 3')
}
