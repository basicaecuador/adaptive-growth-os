import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const maxDuration = 60
import { getPlanWithItems, insertPlanItems } from '@/services/content-plans.service'
import { getBrandWithSetup } from '@/services/brands.service'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'
import type { FunnelStage, PlanIdeaSet, IdeaType } from '@/types/domain'

const ECUADOR_DATES: Record<number, string[]> = {
  1: ['1 ene — Año Nuevo', '6 ene — Día de Reyes'],
  2: ['14 feb — San Valentín', 'Carnaval (fechas variables)'],
  3: ['8 mar — Día de la Mujer', '21 mar — Equinoccio de primavera', 'Semana Santa (fechas variables)'],
  4: ['21 abr — Batalla de Tapi', 'Semana Santa (si aplica)', '22 abr — Día de la Tierra'],
  5: ['1 may — Día del Trabajo', '2do domingo — Día de la Madre', '24 may — Batalla del Pichincha'],
  6: ['3er domingo — Día del Padre', '21 jun — Solsticio de verano', 'Inti Raymi (festejo indígena)'],
  7: ['24 jul — Nacimiento de Simón Bolívar', '25 jul — Fundación de Guayaquil'],
  8: ['10 ago — Primer Grito de Independencia'],
  9: ['28 sep — Consulta Popular (si aplica)'],
  10: ['9 oct — Independencia de Guayaquil', '31 oct — Halloween'],
  11: ['1 nov — Todos los Santos', '2 nov — Día de los Difuntos', '3 nov — Independencia de Cuenca', '4ta semana — Black Friday'],
  12: ['6 dic — Fundación de Quito', '24-25 dic — Navidad', '31 dic — Fin de año'],
}

type RawIdea = {
  type: string
  name: string
  summary: string
  content_type: string
  funnel_objective: string
  hook: string
  hook_type: string
  higgsfield_prompt: string
  development: string
  cta: string
  kpi: string
  why_works: string
  benchmark_reference: string
}

type RawIdeaSet = {
  temporality: string
  scheduled_date: string | null
  funnel_stage: string
  channel: string
  target_emotion: string
  ideas: RawIdea[]
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await params
    const db = createAdminClient()
    const { plan } = await getPlanWithItems(db, planId)
    const brand = await getBrandWithSetup(db, plan.brandId)

    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const monthName = monthNames[plan.month - 1]
    const ecuadorDates = ECUADOR_DATES[plan.month]?.join('\n') ?? ''

    const productsText = plan.products.map(p =>
      `- "${p.name}": ${p.description} (Objetivo de funnel: ${p.objective})`
    ).join('\n')

    const prompt = `Eres un estratega de contenidos experto en marketing digital para mercado latinoamericano, especializado en Ecuador. Conoces el framework Stop/Think/Act para redes sociales: STOP (hook primeros 3 segundos), THINK (desarrollo de mensaje y branding), ACT (CTA visible).

## MARCA
- Nombre: ${brand.name}
- Voz: ${brand.voice || 'No definida'}
- Tono: ${brand.tone || 'No definido'}
- Audiencia: ${brand.targetAudience || 'No definida'}
- Propuesta de valor: ${brand.valueProposition || 'No definida'}
- Pilares de contenido: ${brand.contentPillars?.join(', ') || 'No definidos'}
- Restricciones: ${brand.restrictions?.join(', ') || 'Ninguna'}

## PLAN DE ${monthName.toUpperCase()} ${plan.year}
${plan.context ? `Contexto: ${plan.context}\n` : ''}Productos/servicios:
${productsText}

## BRIEF ESTRATÉGICO APROBADO
${plan.strategicBrief ?? 'No disponible'}

## FECHAS RELEVANTES — ${monthName}
${ecuadorDates}

## INSTRUCCIONES
Genera exactamente ${plan.piecesCount || 12} momentos de contenido. Para CADA momento, genera EXACTAMENTE 3 ideas diferenciadas:
1. **disruptiva** — sorpresiva, interrumpe el scroll, elemento inesperado o contraintuitivo
2. **aspiracional** — conecta emocionalmente con la identidad o sueños de la audiencia
3. **racional** — informativa, datos concretos, responde "¿por qué yo?"

Para el hook de cada idea incluye un prompt específico para Higgsfield (herramienta de generación de video IA) describiendo el arranque visual de los primeros 3 segundos.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional:
[
  {
    "temporality": "Semana 1 — Lunes 6",
    "scheduled_date": "${plan.year}-${String(plan.month).padStart(2,'0')}-06",
    "funnel_stage": "awareness",
    "channel": "Instagram",
    "target_emotion": "Curiosidad",
    "ideas": [
      {
        "type": "disruptiva",
        "name": "Nombre corto (4 palabras máx)",
        "summary": "Una oración que describe el contenido",
        "content_type": "Reel",
        "funnel_objective": "Captar atención de audiencia fría",
        "hook": "Primeros 3s: descripción exacta del arranque visual o de texto que detiene el scroll",
        "hook_type": "Visual",
        "higgsfield_prompt": "Descripción visual detallada para generar el hook: cámara, movimiento, sujeto, acción, atmósfera",
        "development": "Zona segura superior: logo. Mensaje central: [texto]. Zona segura inferior: CTA.",
        "cta": "Texto exacto del call to action",
        "kpi": "Métrica principal: reproducciones y alcance",
        "why_works": "Por qué esta idea funciona para esta audiencia en este momento del mes",
        "benchmark_reference": "Estilo de contenido de referencia (sin nombrar marcas)"
      },
      {
        "type": "aspiracional",
        ...
      },
      {
        "type": "racional",
        ...
      }
    ]
  }
]

Genera los ${plan.piecesCount || 12} momentos distribuidos estratégicamente a lo largo del mes según el brief aprobado.`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: 'You are a JSON generator for a content planning tool. Respond ONLY with a valid JSON array. No markdown, no explanation, no code blocks. Start your response with [ and end with ].',
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = stripped.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error(`Respuesta inválida del modelo: ${stripped.slice(0, 200)}`)

    const generated = JSON.parse(jsonMatch[0].replace(/,\s*([\]}])/g, '$1')) as RawIdeaSet[]

    await db.from('content_plan_items').delete().eq('plan_id', planId)

    const items = await insertPlanItems(db, planId, generated.map((g, i) => {
      const ideaSet: PlanIdeaSet = {
        temporality: g.temporality,
        scheduledDate: g.scheduled_date,
        funnelStage: g.funnel_stage as FunnelStage,
        channel: g.channel,
        targetEmotion: g.target_emotion,
        ideas: (g.ideas ?? []).map(idea => ({
          type: idea.type as IdeaType,
          name: idea.name,
          summary: idea.summary,
          contentType: idea.content_type,
          funnelObjective: idea.funnel_objective,
          hook: idea.hook,
          hookType: idea.hook_type,
          higgsfieldPrompt: idea.higgsfield_prompt,
          development: idea.development,
          cta: idea.cta,
          kpi: idea.kpi,
          whyWorks: idea.why_works,
          benchmarkReference: idea.benchmark_reference,
        })),
      }
      return {
        temporality: g.temporality,
        scheduledDate: g.scheduled_date,
        funnelStage: g.funnel_stage as FunnelStage,
        objective: null,
        idea: null,
        format: null,
        channel: g.channel,
        kpi: null,
        benchmarkReference: null,
        mainMessage: null,
        cta: null,
        observations: null,
        status: 'draft' as const,
        sortOrder: i,
        rawIdeas: ideaSet,
        selectedIdeaType: null,
      }
    }))

    return NextResponse.json({ data: items })
  } catch (err) {
    return errorResponse(err)
  }
}
