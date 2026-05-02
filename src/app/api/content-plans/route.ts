import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listPlansByBrand, createPlan } from '@/services/content-plans.service'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const brandId = req.nextUrl.searchParams.get('brand_id')
    if (!brandId) return NextResponse.json({ error: 'brand_id required' }, { status: 400 })

    const db = createAdminClient()
    const plans = await listPlansByBrand(db, brandId)
    return NextResponse.json({ data: plans })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const db = createAdminClient()
    const plan = await createPlan(db, body)
    return NextResponse.json({ data: plan }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
