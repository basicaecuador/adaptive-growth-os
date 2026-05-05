import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'
import type { ContentExpansionRequest } from '@/types/domain'

function toRequest(row: Record<string, unknown>): ContentExpansionRequest {
  return {
    id: row.id as string,
    planId: row.plan_id as string,
    brandId: row.brand_id as string,
    includedPieces: row.included_pieces as number,
    requiredPieces: row.required_pieces as number,
    additionalPieces: row.additional_pieces as number,
    reason: row.reason as string,
    status: row.status as ContentExpansionRequest['status'],
    requestedAt: new Date(row.requested_at as string),
    requestedBy: row.requested_by as string,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at as string) : null,
    reviewedBy: (row.reviewed_by as string | null) ?? null,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await params
    const db = createAdminClient()
    const { data, error } = await db
      .from('content_expansion_requests')
      .select('*')
      .eq('plan_id', planId)
      .order('requested_at', { ascending: false })

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: (data ?? []).map(toRequest) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await params
    const body = await req.json()

    const { includedPieces, requiredPieces, reason, brandId } = body
    if (!includedPieces || !requiredPieces || !reason || !brandId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const additionalPieces = requiredPieces - includedPieces
    if (additionalPieces <= 0) {
      return NextResponse.json({ error: 'Las piezas requeridas no superan el límite' }, { status: 400 })
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('content_expansion_requests')
      .insert({
        plan_id: planId,
        brand_id: brandId,
        included_pieces: includedPieces,
        required_pieces: requiredPieces,
        additional_pieces: additionalPieces,
        reason,
        status: 'pending',
        requested_by: user.id,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: toRequest(data as Record<string, unknown>) }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
