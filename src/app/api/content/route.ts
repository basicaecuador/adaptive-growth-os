import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listContentByBrand } from '@/services/content.service'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const brandId = req.nextUrl.searchParams.get('brand_id')
    if (!brandId) return NextResponse.json({ error: 'brand_id required' }, { status: 400 })

    const db = createAdminClient()
    const items = await listContentByBrand(db, brandId)
    return NextResponse.json({ data: items })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: 'Use /api/content/generate to create content' }, { status: 400 })
}
