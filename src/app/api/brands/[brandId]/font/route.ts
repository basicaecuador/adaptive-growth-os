import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    const formData = await req.formData()
    const file = formData.get('font') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const db = createAdminClient()
    await db.storage.createBucket('media', { public: true }).catch(() => {})

    const ext = file.name.split('.').pop() ?? 'ttf'
    const path = `brands/${brandId}/font.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await db.storage
      .from('media')
      .upload(path, buffer, { contentType: file.type || 'font/truetype', upsert: true })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(path)

    const { error: updateError } = await db
      .from('brands')
      .update({ font_url: publicUrl })
      .eq('id', brandId)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ data: { fontUrl: publicUrl } })
  } catch (err) {
    return errorResponse(err)
  }
}
