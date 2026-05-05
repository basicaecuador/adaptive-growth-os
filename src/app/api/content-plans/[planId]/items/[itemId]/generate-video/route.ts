import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'

export const maxDuration = 60

const HIGGSFIELD_BASE = 'https://cloud.higgsfield.ai'

const CAMERA_MOTIONS = [
  { id: 'dolly_in',       name: 'Dolly In',        use: 'revelar emociones, acercamiento a producto o rostro' },
  { id: 'dolly_out',      name: 'Dolly Out',        use: 'revelar contexto o escenario, sensación de escala' },
  { id: 'crash_zoom_in',  name: 'Crash Zoom In',    use: 'impacto máximo en los primeros 3s, urgencia o sorpresa' },
  { id: 'crane_up',       name: 'Crane Up',         use: 'aspiración, elevación, revelar el escenario desde arriba' },
  { id: 'fpv_drone',      name: 'FPV Drone',        use: 'dinamismo urbano, energía, audiencia joven' },
  { id: '360_orbit',      name: '360 Orbit',        use: 'presentación de producto o persona desde todos los ángulos' },
  { id: 'whip_pan',       name: 'Whip Pan',         use: 'transición rápida entre escenas, ritmo alto' },
  { id: 'handheld',       name: 'Handheld',         use: 'autenticidad, naturalidad, tono conversacional o testimonial' },
  { id: 'dutch_angle',    name: 'Dutch Angle',      use: 'tensión creativa, diferenciación visual, disruptivo' },
  { id: 'static',         name: 'Static',           use: 'énfasis total en el sujeto y el mensaje, minimalismo' },
  { id: 'focus_change',   name: 'Focus Change',     use: 'revelar segundo plano, transición narrativa suave' },
  { id: 'hyperlapse',     name: 'Hyperlapse',       use: 'paso del tiempo, ciudad en movimiento, transformación' },
]

async function recommendMotionWithClaude(guion: string, hook: string, funnelStage: string, targetEmotion: string): Promise<{
  motionId: string
  motionName: string
  reason: string
  higgsfieldPrompt: string
}> {
  const anthropic = getAnthropicClient()
  const motionList = CAMERA_MOTIONS.map(m => `- ${m.id} (${m.name}): ${m.use}`).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: 'Eres un director de fotografía especializado en contenido viral para redes sociales. Respondes SOLO con JSON válido.',
    messages: [{
      role: 'user',
      content: `Analiza este contenido y recomienda el mejor movimiento de cámara para Higgsfield.

HOOK (primeros 3s): ${hook}
EMOCIÓN OBJETIVO: ${targetEmotion}
ETAPA FUNNEL: ${funnelStage}
GUION APROBADO:
${guion}

MOVIMIENTOS DISPONIBLES:
${motionList}

Selecciona el movimiento que maximice el impacto emocional y la retención en los primeros 3 segundos.

Devuelve SOLO JSON:
{
  "motion_id": "id_del_movimiento",
  "motion_name": "nombre",
  "reason": "por qué este movimiento (1 oración)",
  "higgsfield_prompt": "prompt completo optimizado para Higgsfield en inglés, incluye: descripción visual del escenario, acción principal, atmósfera, iluminación, y el movimiento de cámara seleccionado. Máximo 200 palabras."
}`
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Error al generar recomendación de cámara')
  const data = JSON.parse(match[0])

  return {
    motionId: data.motion_id,
    motionName: data.motion_name,
    reason: data.reason,
    higgsfieldPrompt: data.higgsfield_prompt,
  }
}

async function submitHiggsfieldJob(prompt: string, motionId: string, referenceImageUrl?: string): Promise<string> {
  const apiKey = process.env.HIGGSFIELD_API_KEY
  if (!apiKey) throw new Error('HIGGSFIELD_API_KEY no configurada')

  const body: Record<string, unknown> = {
    prompt,
    enhance_prompt: true,
  }

  // Use DoP Turbo (image-to-video) if reference image provided, else WAN text-to-video
  if (referenceImageUrl) {
    body.model = 'dop-turbo'
    body.input_image = referenceImageUrl
  } else {
    body.model = 'wan-pro'
  }

  // Add motion if supported by the model
  if (motionId !== 'static') {
    body.motion = motionId
  }

  const res = await fetch(`${HIGGSFIELD_BASE}/v1/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message ?? err?.detail ?? `Error Higgsfield (HTTP ${res.status})`)
  }

  const result = await res.json()
  const jobId = result.id ?? result.job_id ?? result.generation_id
  if (!jobId) throw new Error('Higgsfield no devolvió un job ID')
  return String(jobId)
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
    const customPrompt: string | undefined = body?.prompt
    const customMotionId: string | undefined = body?.motionId
    const referenceImageUrl: string | undefined = body?.referenceImageUrl

    const db = createAdminClient()
    const { data: item, error } = await db
      .from('content_plan_items')
      .select('*')
      .eq('id', itemId)
      .eq('plan_id', planId)
      .single()

    if (error || !item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const rawIdeas = item.raw_ideas as {
      ideas: Array<{ development: string; hook: string; higgsfieldPrompt?: string }>
      funnelStage: string
      targetEmotion: string
    } | null

    const idea = rawIdeas?.ideas?.[0]
    if (!idea) return NextResponse.json({ error: 'No hay idea aprobada para esta pieza' }, { status: 400 })

    let finalPrompt: string
    let finalMotionId: string
    let motionName: string
    let reason: string

    if (customPrompt && customMotionId) {
      finalPrompt = customPrompt
      finalMotionId = customMotionId
      motionName = CAMERA_MOTIONS.find(m => m.id === customMotionId)?.name ?? customMotionId
      reason = ''
    } else {
      // Claude recomienda el movimiento y genera el prompt
      const recommendation = await recommendMotionWithClaude(
        idea.development,
        idea.hook,
        rawIdeas?.funnelStage ?? '',
        rawIdeas?.targetEmotion ?? '',
      )
      finalPrompt = recommendation.higgsfieldPrompt
      finalMotionId = recommendation.motionId
      motionName = recommendation.motionName
      reason = recommendation.reason
    }

    const jobId = await submitHiggsfieldJob(finalPrompt, finalMotionId, referenceImageUrl)

    return NextResponse.json({
      data: {
        jobId,
        prompt: finalPrompt,
        motionId: finalMotionId,
        motionName,
        reason,
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
