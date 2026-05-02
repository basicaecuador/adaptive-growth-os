import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updatePlanItem } from '@/services/content-plans.service'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; itemId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { itemId } = await params
    const body = await req.json()
    const db = createAdminClient()
    const item = await updatePlanItem(db, itemId, body)
    return NextResponse.json({ data: item })
  } catch (err) {
    return errorResponse(err)
  }
}
