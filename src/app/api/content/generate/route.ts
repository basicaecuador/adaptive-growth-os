import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { getOpenAIClient } from '@/lib/ai/openai'
import { createContentItem } from '@/services/content.service'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'
import sharp from 'sharp'

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  return Buffer.from(await res.arrayBuffer())
}

async function compositeImage(
  baseBuffer: Buffer,
  logoUrl: string | null,
  fontUrl: string | null,
  brandName: string,
  primaryColor: string,
): Promise<Buffer> {
  const image = sharp(baseBuffer)
  const { width = 1024, height = 1024 } = await image.metadata()

  const composites: sharp.OverlayOptions[] = []

  // Bottom gradient overlay
  const gradientSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="60%" stop-color="transparent" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.65"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
  </svg>`
  composites.push({ input: Buffer.from(gradientSvg), top: 0, left: 0 })

  // Brand name text using custom font if available
  const textY = height - 36
  const textX = logoUrl ? Math.round(width * 0.18) : 28

  if (fontUrl) {
    try {
      const fontBuffer = await fetchBuffer(fontUrl)
      const fontBase64 = fontBuffer.toString('base64')
      const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <defs>
          <style>@font-face { font-family: 'BF'; src: url('data:font/truetype;base64,${fontBase64}'); }</style>
        </defs>
        <text x="${textX}" y="${textY}" font-family="BF, sans-serif" font-size="38" font-weight="bold" fill="${primaryColor}" paint-order="stroke" stroke="rgba(0,0,0,0.6)" stroke-width="3" stroke-linejoin="round">${brandName}</text>
      </svg>`
      composites.push({ input: Buffer.from(textSvg), top: 0, left: 0 })
    } catch {
      // fallback: no custom font text
    }
  }

  // Logo overlay (bottom-left)
  if (logoUrl) {
    try {
      const logoBuffer = await fetchBuffer(logoUrl)
      const logoSize = Math.round(width * 0.12)
      const padding = Math.round(width * 0.03)
      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
      composites.push({
        input: resizedLogo,
        top: height - logoSize - padding,
        left: padding,
      })
    } catch {
      // skip logo on error
    }
  }

  return image.composite(composites).png().toBuffer()
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId, platform, type, topic } = await req.json()
    if (!brandId || !platform || !type || !topic) {
      return NextResponse.json(
        { error: 'brandId, platform, type y topic son requeridos' },
        { status: 400 },
      )
    }

    const db = createAdminClient()

    const { data: brand } = await db
      .from('brands')
      .select('name, voice, tone, target_audience, logo_url, font_url, primary_color')
      .eq('id', brandId)
      .single()

    const systemPrompt = [
      `Eres un experto en marketing de contenidos para la marca "${brand?.name ?? 'la marca'}".`,
      brand?.voice ? `Voz de marca: ${brand.voice}` : '',
      brand?.tone ? `Tono: ${brand.tone}` : '',
      brand?.target_audience ? `Audiencia objetivo: ${brand.target_audience}` : '',
      'Genera contenido auténtico, atractivo y alineado con la identidad de la marca.',
    ].filter(Boolean).join('\n')

    const userPrompt = `Genera un ${type} para ${platform} sobre: "${topic}". Solo devuelve el texto del contenido, listo para publicar.`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS ?? 1024),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const body = message.content[0].type === 'text' ? message.content[0].text : ''

    // Generate image with DALL-E 3 + composite branding
    let imageUrl: string | null = null
    try {
      const imagePrompt = [
        `Professional marketing visual for ${brand?.name ?? 'a brand'}.`,
        `Platform: ${platform}. Content type: ${type}. Topic: ${topic}.`,
        brand?.voice ? `Brand style: ${brand.voice}.` : '',
        `Clean composition with space at the bottom for branding. No text in the image.`,
      ].filter(Boolean).join(' ')

      const openai = getOpenAIClient()
      const imageRes = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: platform === 'instagram' || platform === 'tiktok' ? '1024x1024' : '1792x1024',
        quality: 'standard',
      })

      const dalleUrl = imageRes.data?.[0]?.url
      if (dalleUrl) {
        const baseBuffer = await fetchBuffer(dalleUrl)

        const finalBuffer = await compositeImage(
          baseBuffer,
          brand?.logo_url ?? null,
          brand?.font_url ?? null,
          brand?.name ?? '',
          brand?.primary_color ?? '#ffffff',
        )

        await db.storage.createBucket('media', { public: true }).catch(() => {})
        const tempId = crypto.randomUUID()
        const path = `content/${tempId}/image.png`

        await db.storage.from('media').upload(path, finalBuffer, {
          contentType: 'image/png',
          upsert: true,
        })

        const { data } = db.storage.from('media').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    } catch (imgErr) {
      console.error('[image-gen]', imgErr)
    }

    const item = await createContentItem(db, {
      brandId,
      createdBy: user.id,
      type,
      platform,
      body,
      notes: topic,
      imageUrl,
    })

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
