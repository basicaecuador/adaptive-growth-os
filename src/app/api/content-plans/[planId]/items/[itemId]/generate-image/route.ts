import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'

export const maxDuration = 300

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

  // Clean up design-spec language that confuses image generators
  visualDesc = visualDesc
    .replace(/^\[|\]$/g, '')
    .replace(/tipografía[^,.\n]*/gi, '')
    .replace(/fondo\s+(azul|blanco|negro|gris|color)[^,.\n]*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return visualDesc
}

async function generateWithFlux(prompt: string, isVertical: boolean): Promise<string> {
  const imageSize = isVertical ? 'portrait_16_9' : 'square_hd'
  const res = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: imageSize,
      num_images: 1,
      enable_safety_checker: true,
    }),
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

async function generateWithGptImage1(prompt: string, isVertical: boolean): Promise<string> {
  const size = isVertical ? '1024x1536' : '1024x1024'
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

async function generateWithDalle3(prompt: string, isVertical: boolean): Promise<string> {
  const size = isVertical ? '1024x1792' : '1024x1024'
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

    const formatFromIdea = rawIdeas?.ideas?.[0]?.contentType ?? 'Post'
    const isVertical = /historia|story/i.test(formatFromIdea)

    let prompt: string
    if (customPrompt) {
      prompt = customPrompt
    } else {
      const idea = rawIdeas?.ideas?.[0]
      if (!idea) return NextResponse.json({ error: 'No hay idea generada para esta pieza' }, { status: 400 })
      const visualSubject = buildImagePrompt(idea.development, idea.contentType ?? 'Post', idea.hook)
      const aspectNote = isVertical ? 'vertical portrait 9:16' : 'square 1:1'
      prompt = [
        'Ultra-realistic professional commercial lifestyle photography, warm natural light, vibrant colors, sharp focus, 4K quality.',
        `Subject: ${visualSubject}.`,
        'Mood: positive, aspirational, authentic. Real people in real situations, not stock photo poses.',
        `Format: ${aspectNote}. No text overlays, no logos, no watermarks.`,
      ].join(' ')
    }

    let imageUrl: string
    if (model === 'flux') {
      imageUrl = await generateWithFlux(prompt, isVertical)
    } else if (model === 'gpt-image-1') {
      imageUrl = await generateWithGptImage1(prompt, isVertical)
    } else {
      imageUrl = await generateWithDalle3(prompt, isVertical)
    }

    return NextResponse.json({ data: { imageUrl } })
  } catch (err) {
    return errorResponse(err)
  }
}
