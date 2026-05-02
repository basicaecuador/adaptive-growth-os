// Implemented in FASE 3 — approval workflow state machine
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Approval, ApprovalStatus } from '@/types/domain'
import type { ApproveContentRequest } from '@/types/api'

// Valid state transitions for the approval workflow
const VALID_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  pending: ['approved', 'rejected', 'changes_requested'],
  changes_requested: ['pending'],
  approved: ['rejected'],
  rejected: [],
}

export function isValidTransition(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export async function getApproval(
  _supabase: SupabaseClient,
  _contentId: string,
): Promise<Approval | null> {
  throw new Error('Not implemented — FASE 3')
}

export async function processApproval(
  _supabase: SupabaseClient,
  _reviewerId: string,
  _input: ApproveContentRequest,
): Promise<Approval> {
  throw new Error('Not implemented — FASE 3')
}

export async function listPendingApprovals(
  _supabase: SupabaseClient,
  _organizationId: string,
): Promise<Approval[]> {
  throw new Error('Not implemented — FASE 3')
}
