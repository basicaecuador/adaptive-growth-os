import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'
import type { AdFormat, GeneratedAsset } from '@/types/domain'

export const maxDuration = 300

const FORMAT_CONFIG = {
  square: {
    label: 'Feed 1:1',
    fluxSize: 'square_hd',
    gptSize: '1024x1024',
    dalleSize: '1024x1024',
    w: 1024, h: 1024,
  },
  story: {
    label: 'Story / Reel 9:16',
    fluxSize: { width: 768, height: 1344 },
    gptSize: '1024x1536',
    dalleSize: '1024x1792',
    w: 1024, h: 1792,
  },
  landscape: {
    label: 'Paisaje 16:9',
    fluxSize: { width: 1344, height: 768 },
    gptSize: '1536x1024',
    dalleSize: '1792x1024',
    w: 1792, h: 1024,
  },
} as const

function buildImagePrompt(development: string, format: string, hook: string): string {
  const isCarousel = /carrusel|carousel/i.test(format)
  let visualDesc = ''

  if (isCarousel) {
    const s1 = development.match(/S1[^|]*\|\s*Visual:\s*([^\n]+)/i)
    visualDesc = s1?.[1]?.trim() ?? ''
  }

  if (!visualDesc) {
    const visual = development.match(/VISUAL:\s*([^\n]+)/i)
    visualDesc = visual?.[1]?.trim() ?? ''
  }

  if (!visualDesc) visualDesc = hook

  return visualDesc
    .replace(/^\[|\]$/g, '')
    .replace(/tipografía[^,.\n]*/gi, '')
    .replace(/fondo\s+(azul|blanco|negro|gris|color)[^,.\n]*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function generateWithFlux(prompt: string, fmt: AdFormat): Promise<string> {
  const imageSize = FORMAT_CONFIG[fmt].fluxSize
  const res = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, image_size: imageSize, num_images: 1, enable_safety_checker: true }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? `Error Flux (HTTP ${res.status})`)
  }
  const result = await res.json()
  const url = result.images?.[0]?.url
  if (!url) throw new Error('Flux no devolvió imagen')
  return url
}

async function generateWithGptImage1(prompt: string, fmt: AdFormat): Promise<string> {
  const size = FORMAT_CONFIG[fmt].gptSize
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size, quality: 'medium' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Error gpt-image-1 (HTTP ${res.status})`)
  }
  const result = await res.json()
  const b64 = result.data?.[0]?.b64_json
  if (!b64) throw new Error('gpt-image-1 no devolvió imagen')
  return `data:image/png;base64,${b64}`
}

async function generateWithDalle3(prompt: string, fmt: AdFormat): Promise<string> {
  const size = FORMAT_CONFIG[fmt].dalleSize
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality: 'standard', style: 'natural' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Error DALL-E 3 (HTTP ${res.status})`)
  }
  const result = await res.json()
  const url = result.data?.[0]?.url
  if (!url) throw new Error('DALL-E 3 no devolvió imagen')
  return url
}

async function uploadToStorage(
  db: ReturnType<typeof createAdminClient>,
  imageData: string,
  storageKey: string,
): Promise<string> {
  let buffer: Buffer

  if (imageData.startsWith('data:')) {
    const base64 = imageData.split(',')[1]
    buffer = Buffer.from(base64, 'base64')
  } else {
    const res = await fetch(imageData)
    if (!res.ok) throw new Error('Error descargando imagen para almacenamiento')
    buffer = Buffer.from(await res.arrayBuffer())
  }

  const { error } = await db.storage
    .from('plan-assets')
    .upload(storageKey, buffer, { contentType: 'image/png', upsert: true })

  if (error) throw new Error(`Error al subir imagen: ${error.message}`)

  const { data: urlData } = db.storage.from('plan-assets').getPublicUrl(storageKey)
  return urlData.publicUrl
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; itemId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId, itemId } = await params
    const body = await req.json().catch(() => ({}))
    const customPrompt: string | undefined = body?.prompt || undefined
    const model: string = body?.model ?? 'flux'
    const targetFormat: AdFormat = body?.targetFormat ?? 'square'

    const db = createAdminClient()

    const { data: item, error } = await db
      .from('content_plan_items')
      .select('*')
      .eq('id', itemId)
      .eq('plan_id', planId)
      .single()

    if (error || !item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const rawIdeas = item.raw_ideas as {
      ideas: Array<{ development: string; contentType: string; hook: string }>
    } | null

    let prompt: string
    if (customPrompt) {
      prompt = customPrompt
    } else {
      const idea = rawIdeas?.ideas?.[0]
      if (!idea) return NextResponse.json({ error: 'No hay idea generada para esta pieza' }, { status: 400 })
      const visualSubject = buildImagePrompt(idea.development, idea.contentType ?? 'Post', idea.hook)
      const aspectNote = targetFormat === 'story' ? 'vertical 9:16 portrait' : targetFormat === 'landscape' ? 'horizontal 16:9 landscape' : 'square 1:1'
      prompt = [
        'Ultra-realistic professional commercial lifestyle photography, warm natural light, vibrant colors, sharp focus, 4K quality.',
        `Subject: ${visualSubject}.`,
        'Mood: positive, aspirational, authentic. Real people in real situations, not stock photo poses.',
        `Format: ${aspectNote}. No text overlays, no logos, no watermarks.`,
      ].join(' ')
    }

    // Generate image
    let rawImageData: string
    if (model === 'flux') {
      rawImageData = await generateWithFlux(prompt, targetFormat)
    } else if (model === 'gpt-image-1') {
      rawImageData = await generateWithGptImage1(prompt, targetFormat)
    } else {
      rawImageData = await generateWithDalle3(prompt, targetFormat)
    }

    // Upload to Supabase Storage
    const storageKey = `${planId}/${itemId}/${targetFormat}-${Date.now()}.png`
    const storageUrl = await uploadToStorage(db, rawImageData, storageKey)

    // Build asset record
    const fmtConfig = FORMAT_CONFIG[targetFormat]
    const newAsset: GeneratedAsset = {
      format: targetFormat,
      label: fmtConfig.label,
      url: storageUrl,
      storageKey,
      model,
      width: fmtConfig.w,
      height: fmtConfig.h,
      generatedAt: new Date().toISOString(),
    }

    // Upsert into generated_assets (replace same format, keep others)
    const currentAssets = (item.generated_assets as GeneratedAsset[] | null) ?? []
    const updatedAssets: GeneratedAsset[] = [
      ...currentAssets.filter((a: GeneratedAsset) => a.format !== targetFormat),
      newAsset,
    ]

    await db
      .from('content_plan_items')
      .update({ generated_assets: updatedAssets, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    return NextResponse.json({ data: { imageUrl: storageUrl, asset: newAsset } })
  } catch (err) {
    return errorResponse(err)
  }
}
