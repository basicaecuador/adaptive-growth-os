import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPlanWithItems, updatePlan } from '@/services/content-plans.service'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await params
    const db = createAdminClient()
    const data = await getPlanWithItems(db, planId)
    return NextResponse.json({ data })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await params
    const body = await req.json()
    const db = createAdminClient()
    const plan = await updatePlan(db, planId, {
      strategicBrief: body.strategicBrief,
      channelMix: body.channelMix,
      funnelFocus: body.funnelFocus,
      piecesCount: body.piecesCount,
      status: body.status,
    })
    return NextResponse.json({ data: plan })
  } catch (err) {
    return errorResponse(err)
  }
}
