import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getBrandWithSetup, upsertBrandSetup } from '@/services/brands.service'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    const db = createAdminClient()
    const data = await getBrandWithSetup(db, brandId)
    return NextResponse.json({ data })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    const body = await req.json()
    const db = createAdminClient()
    // Save primary_color directly if provided
    if (body.primaryColor !== undefined) {
      await db.from('brands').update({ primary_color: body.primaryColor }).eq('id', brandId)
    }

    const setup = await upsertBrandSetup(db, {
      brandId,
      voice: body.voice ?? '',
      tone: body.tone ?? '',
      targetAudience: body.targetAudience ?? '',
      valueProposition: body.valueProposition ?? '',
      contentPillars: body.contentPillars ?? [],
      restrictions: body.restrictions ?? [],
      monthlyPiecesLimit: typeof body.monthlyPiecesLimit === 'number' ? body.monthlyPiecesLimit : undefined,
      updatedAt: new Date(),
    })
    return NextResponse.json({ data: setup })
  } catch (err) {
    return errorResponse(err)
  }
}
