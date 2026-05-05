import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'

export const maxDuration = 60

function buildImagePrompt(development: string, format: string, hook: string): string {
  const isCarousel = /carrusel|carousel/i.test(format)
  const isVertical = /historia|story/i.test(format)

  // Extract visual description only — never copy/script text
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

  const aspectRatio = isVertical
    ? 'vertical 9:16 portrait, subject centered away from top and bottom 15%'
    : 'square 1:1, subject centered with breathing room'

  return [
    'Ultra-realistic professional commercial lifestyle photography, warm natural light, vibrant colors, sharp perfect focus, 4K quality.',
    `Subject: ${visualDesc}.`,
    'Mood: positive, aspirational, authentic. Real people in real everyday situations, not artificial stock photo poses.',
    `Format: ${aspectRatio}. No text overlays, no logos, no watermarks, no frames.`,
  ].join(' ')
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
    const size = isVertical ? '1024x1792' : '1024x1024'

    let prompt: string
    if (customPrompt) {
      prompt = customPrompt
    } else {
      const idea = rawIdeas?.ideas?.[0]
      if (!idea) return NextResponse.json({ error: 'No hay idea generada para esta pieza' }, { status: 400 })
      prompt = buildImagePrompt(idea.development, idea.contentType ?? 'Post', idea.hook)
    }

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'hd',
        style: 'natural',
      }),
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody?.error?.message ?? `Error generando imagen (HTTP ${res.status})`)
    }

    const result = await res.json()
    const imageUrl: string = result.data[0].url

    return NextResponse.json({ data: { imageUrl } })
  } catch (err) {
    return errorResponse(err)
  }
}
