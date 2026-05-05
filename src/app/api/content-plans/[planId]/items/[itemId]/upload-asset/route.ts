import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'
import type { GeneratedAsset, AdFormat } from '@/types/domain'

export const maxDuration = 60

const FORMAT_LABELS: Record<AdFormat, string> = {
  square: 'Feed 1:1',
  story: 'Story / Reel 9:16',
  landscape: 'Paisaje 16:9',
}

const FORMAT_DIMS: Record<AdFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
  landscape: { w: 1920, h: 1080 },
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; itemId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId, itemId } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const targetFormat = (formData.get('targetFormat') as AdFormat) ?? 'square'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const db = createAdminClient()

    const { data: item, error } = await db
      .from('content_plan_items')
      .select('id, generated_assets')
      .eq('id', itemId)
      .eq('plan_id', planId)
      .single()

    if (error || !item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const contentType = file.type || (ext === 'mp4' ? 'video/mp4' : 'image/jpeg')
    const isVideo = contentType.startsWith('video/')

    const storageKey = `${planId}/${itemId}/${targetFormat}-upload-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await db.storage
      .from('plan-assets')
      .upload(storageKey, buffer, { contentType, upsert: true })

    if (uploadError) throw new Error(`Error al subir: ${uploadError.message}`)

    const { data: urlData } = db.storage.from('plan-assets').getPublicUrl(storageKey)
    const storageUrl = urlData.publicUrl

    const dims = FORMAT_DIMS[targetFormat]
    const newAsset: GeneratedAsset = {
      format: targetFormat,
      label: FORMAT_LABELS[targetFormat],
      url: storageUrl,
      storageKey,
      model: isVideo ? 'upload-video' : 'upload-image',
      width: dims.w,
      height: dims.h,
      generatedAt: new Date().toISOString(),
    }

    const currentAssets = (item.generated_assets as GeneratedAsset[] | null) ?? []
    const updatedAssets: GeneratedAsset[] = [
      ...currentAssets.filter((a: GeneratedAsset) => a.format !== targetFormat),
      newAsset,
    ]

    await db
      .from('content_plan_items')
      .update({ generated_assets: updatedAssets, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    return NextResponse.json({ data: { url: storageUrl, asset: newAsset } })
  } catch (err) {
    return errorResponse(err)
  }
}
