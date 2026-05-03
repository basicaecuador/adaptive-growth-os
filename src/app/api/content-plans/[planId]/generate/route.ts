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
  3: ['8 mar — Día de la Mujer', '21 mar — Equinoccio', 'Semana Santa (fechas variables)'],
  4: ['21 abr — Batalla de Tapi', 'Semana Santa (si aplica)', '22 abr — Día de la Tierra'],
  5: ['1 may — Día del Trabajo', '2do domingo — Día de la Madre', '24 may — Batalla del Pichincha'],
  6: ['3er domingo — Día del Padre', '21 jun — Solsticio', 'Inti Raymi'],
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
  format: string
  hook: string
  higgsfield_prompt: string
  structure: string
  cta: string
  kpi: string
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
    const pieces = plan.piecesCount || 12

    const productsText = plan.products.map(p => `- "${p.name}": ${p.description}`).join('\n')
    const channelList = (plan.channelMix ?? []).join(', ') || 'Instagram'

    const prompt = `Estratega de contenidos para Ecuador/Latam. Framework Stop/Think/Act.

MARCA: ${brand.name} | Voz: ${brand.voice || 'No definida'} | Audiencia: ${brand.targetAudience || 'No definida'}
PROPUESTA: ${brand.valueProposition || 'No definida'}
PRODUCTOS: ${productsText}
MES: ${monthName} ${plan.year}
BRIEF: ${(plan.strategicBrief ?? '').slice(0, 800)}
FECHAS: ${ecuadorDates}
CANALES ACTIVOS: ${channelList} — USA ÚNICAMENTE estos canales en el campo "channel". No uses ningún otro canal.

TAREA: Genera exactamente ${pieces} momentos de contenido. Cada momento tiene 3 ideas: disruptiva, aspiracional, racional. Distribuye los momentos entre los canales activos.

CAMPOS por idea — lineamientos creativos para producción. La idea aprobada será el insumo directo para generar el contenido final en la siguiente fase.

Reglas de formato:
- format: Reel | Carrusel | Post | Historia
- higgsfield_prompt: SOLO incluir si format es "Reel" o "Historia" (video). Para Post o Carrusel: dejar como "" (string vacío)
- hook: para video (Reel/Historia) → qué ocurre en los primeros 3s visualmente. Para Post/Carrusel → primera línea o título impactante. (10 palabras máx)
- structure: SEGÚN FORMATO —
  * Reel/Historia: "[Apertura]. [Desarrollo]. [Cierre + CTA]." (1 oración por acto)
  * Carrusel: "S1: [tema]. S2: [tema]. S3: [tema]. S4: CTA." (máx 4 slides)
  * Post: concepto del caption y tono (1-2 oraciones)
- name: título del concepto (3 palabras máx)
- cta: texto exacto (5 palabras máx)
- kpi: métrica principal (2 palabras máx)

JSON — valores BREVES, sigue exactamente esta estructura:
[{"temporality":"Sem 1 — Lun 6","scheduled_date":"${plan.year}-${String(plan.month).padStart(2,'0')}-06","funnel_stage":"awareness","channel":"Instagram","target_emotion":"Curiosidad","ideas":[{"type":"disruptiva","name":"Concepto tres palabras","format":"Reel","hook":"Persona descubre resultado inesperado en pantalla","higgsfield_prompt":"Zoom rápido a pantalla brillante, expresión sorpresa","structure":"Hook: reacción sorpresa. Desarrollo: revela el beneficio. Cierre: marca + CTA.","cta":"Descúbrelo ahora","kpi":"Reproducciones"},{"type":"aspiracional","name":"...","format":"Carrusel","hook":"Título que conecta con aspiración","higgsfield_prompt":"","structure":"S1: Sueño de la audiencia. S2: Obstáculo. S3: Solución con marca. S4: CTA.","cta":"Empieza hoy","kpi":"Guardados"},{"type":"racional","name":"...","format":"Post","hook":"Estadística o hecho concreto","higgsfield_prompt":"","structure":"Caption directo con dato + beneficio + llamado a acción claro.","cta":"Ver más","kpi":"Clics"}]}]`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: 'JSON generator. Respond ONLY with a valid JSON array. No markdown, no code blocks. Start with [ end with ].',
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
          summary: idea.structure ?? '',
          contentType: idea.format ?? '',
          funnelObjective: '',
          hook: idea.hook,
          hookType: '',
          higgsfieldPrompt: idea.higgsfield_prompt,
          development: idea.structure ?? '',
          cta: idea.cta,
          kpi: idea.kpi ?? '',
          whyWorks: '',
          benchmarkReference: '',
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
