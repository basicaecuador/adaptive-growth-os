import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'
import type { PlanIdeaSet, PlanIdea, IdeaType } from '@/types/domain'

export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; itemId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await params
    const body = await req.json()
    const ideaType: IdeaType = body.ideaType
    const feedback: string = body.feedback
    const currentIdeaSet: PlanIdeaSet = body.currentIdeaSet

    const ideaToRefine = currentIdeaSet.ideas.find(i => i.type === ideaType)
    if (!ideaToRefine) throw new Error('Idea no encontrada')

    const otherIdeas = currentIdeaSet.ideas
      .filter(i => i.type !== ideaType)
      .map(i => `- ${i.type}: ${i.name} — ${i.summary}`)
      .join('\n')

    const prompt = `Eres un experto en content strategy para redes sociales en Ecuador y Latinoamérica. Aplicas el framework Stop/Think/Act: STOP (hook 3 segundos), THINK (desarrollo + branding), ACT (CTA visible).

## CONTEXTO DEL MOMENTO DE CONTENIDO
- Temporalidad: ${currentIdeaSet.temporality}
- Canal: ${currentIdeaSet.channel}
- Etapa del funnel: ${currentIdeaSet.funnelStage}
- Emoción objetivo: ${currentIdeaSet.targetEmotion}

## OTRAS IDEAS YA GENERADAS PARA ESTE MOMENTO
${otherIdeas}

## IDEA A REFINAR (tipo: ${ideaType})
- Nombre: ${ideaToRefine.name}
- Resumen: ${ideaToRefine.summary}
- Tipo de contenido: ${ideaToRefine.contentType}
- Hook (3s): ${ideaToRefine.hook}
- Higgsfield: ${ideaToRefine.higgsfieldPrompt}
- Desarrollo: ${ideaToRefine.development}
- CTA: ${ideaToRefine.cta}
- KPI: ${ideaToRefine.kpi}
- Por qué funciona: ${ideaToRefine.whyWorks}

## AJUSTE SOLICITADO
"${feedback}"

Genera la versión refinada aplicando el ajuste. Mantén el tipo "${ideaType}". Responde ÚNICAMENTE con JSON válido:
{
  "type": "${ideaType}",
  "name": "...",
  "summary": "...",
  "content_type": "...",
  "funnel_objective": "...",
  "hook": "...",
  "hook_type": "...",
  "higgsfield_prompt": "...",
  "development": "...",
  "cta": "...",
  "kpi": "...",
  "why_works": "...",
  "benchmark_reference": "..."
}`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: 'You are a JSON generator. Respond ONLY with a valid JSON object. No markdown, no explanation.',
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`Respuesta inválida: ${stripped.slice(0, 200)}`)

    const raw = JSON.parse(jsonMatch[0].replace(/,\s*([\]}])/g, '$1')) as Record<string, string>

    const refined: PlanIdea = {
      type: ideaType,
      name: raw.name ?? '',
      summary: raw.summary ?? '',
      contentType: raw.content_type ?? '',
      funnelObjective: raw.funnel_objective ?? '',
      hook: raw.hook ?? '',
      hookType: raw.hook_type ?? '',
      higgsfieldPrompt: raw.higgsfield_prompt ?? '',
      development: raw.development ?? '',
      cta: raw.cta ?? '',
      kpi: raw.kpi ?? '',
      whyWorks: raw.why_works ?? '',
      benchmarkReference: raw.benchmark_reference ?? '',
    }

    return NextResponse.json({ data: refined })
  } catch (err) {
    return errorResponse(err)
  }
}
