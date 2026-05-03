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

type RawPiece = {
  product: string
  funnel_stage: string
  temporality: string
  scheduled_date: string | null
  channel: string
  target_emotion: string
  idea_type: string
  format: string
  name: string
  hook: string
  higgsfield_prompt: string
  content: string
  cta: string
  kpi: string
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

    const products = plan.products
    const numProducts = products.length
    const totalPieces = numProducts * 7

    const productsDetail = products.map((p, i) =>
      `${i + 1}. "${p.name}": ${p.description}${p.objective ? ` — objetivo: ${p.objective}` : ''}`
    ).join('\n')

    const channelList = (plan.channelMix ?? []).join(', ') || 'Instagram'
    const mm = String(plan.month).padStart(2, '0')
    const yy = plan.year

    const prompt = `Estratega de contenidos para Ecuador/Latam. Framework Stop/Think/Act.

MARCA: ${brand.name} | Voz: ${brand.voice || 'N/A'} | Audiencia: ${brand.targetAudience || 'N/A'}
PROPUESTA: ${brand.valueProposition || 'N/A'}
MES: ${monthName} ${yy} | FECHAS CLAVE: ${ecuadorDates}
BRIEF: ${(plan.strategicBrief ?? '').slice(0, 500)}
CANALES ACTIVOS (SOLO estos): ${channelList}

PRODUCTOS:
${productsDetail}

INSTRUCCIÓN:
Construye un funnel de contenido ESPECÍFICO para cada producto. NO mezcles productos en una misma pieza.
Por cada producto genera exactamente 7 piezas en 4 etapas:
- awareness (2 piezas, Sem 1-2): captar audiencia nueva, primera impresión
- consideration (2 piezas, Sem 2-3): educar, mostrar valor, generar interés activo
- conversion (2 piezas, Sem 3-4): cerrar venta, generar lead, urgencia o prueba social
- remarketing (1 pieza, Sem 4): retarget a quien interactuó sin convertir

TOTAL: ${numProducts} producto(s) × 7 = ${totalPieces} piezas

Genera UNA idea por pieza, completamente desarrollada y lista para producción.
FORMATOS: Reel | Carrusel | Post estático | Historia | Google Search Ad | Google Display

CONTENIDO REQUERIDO POR FORMATO:

Reel/Historia → content="ESC1 (Xs): Visual:[...] | Voz:[texto hablado] | Pantalla:[texto en pantalla]\nESC2 (Xs): Visual:[...] | Voz:[...] | Pantalla:[...]\nESC3 (Xs): Visual:[...] | Voz:[...] | Pantalla:[...]\nDURACIÓN: Xs"

Carrusel → content="S1: [texto titular] | Visual:[...]\nS2: [texto] | Visual:[...]\nS3: [texto] | Visual:[...]\nS4: [texto] | Visual:[...]\nS5 CTA: [texto CTA] | Visual:[...]"

Post estático → content="TITULAR: [...]\nCUERPO: [caption completo, 2-3 oraciones con tono de marca]\nVISUAL: [descripción de imagen o gráfico]"

Google Search Ad → content="T1: [...](≤30c)\nT2: [...](≤30c)\nT3: [...](≤30c)\nD1: [...](≤90c)\nD2: [...](≤90c)\nURL: [dominio/ruta]"

Google Display → content="TITULAR: [...]\nCUERPO: [texto breve]\nCTA: [texto botón]\nVISUAL: [descripción banner]"

REGLAS:
- channel: SOLO canales de la lista activa
- higgsfield_prompt: SOLO para Reel/Historia ("" para el resto)
- hook (10 palabras máx): video→primeros 3s visuales | resto→titular impactante
- idea_type: awareness→disruptiva | consideration→aspiracional | conversion/remarketing→racional
- name: 3 palabras máx | cta: 5 palabras máx | kpi: 2 palabras máx

JSON — solo el array sin markdown:
[{"product":"nombre exacto producto","funnel_stage":"awareness","temporality":"Sem 1 — ${monthName} 3","scheduled_date":"${yy}-${mm}-03","channel":"Instagram","target_emotion":"Curiosidad","idea_type":"disruptiva","format":"Reel","name":"Tres palabras concepto","hook":"Apertura visual que detiene el scroll","higgsfield_prompt":"Zoom rápido a rostro sorprendido, luz dramática","content":"ESC1 (3s): Visual:[primer plano sorpresa] | Voz:[¿Sabías que puedes...?] | Pantalla:[Esto cambia todo]\\nESC2 (12s): Visual:[demo del producto en acción] | Voz:[Con X puedes lograr Y en Z días] | Pantalla:[Beneficio principal]\\nESC3 (5s): Visual:[marca + resultado] | Voz:[Empieza hoy, sin compromiso] | Pantalla:[CTA]\\nDURACIÓN: 20s","cta":"Empieza hoy gratis","kpi":"Reproducciones"}]`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5000,
      system: 'JSON generator. Respond ONLY with a valid JSON array. No markdown, no code blocks. Start with [ end with ].',
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = stripped.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error(`Respuesta inválida del modelo: ${stripped.slice(0, 200)}`)

    const generated = JSON.parse(jsonMatch[0].replace(/,\s*([\]}])/g, '$1')) as RawPiece[]

    await db.from('content_plan_items').delete().eq('plan_id', planId)

    const items = await insertPlanItems(db, planId, generated.map((raw, i) => {
      const ideaSet: PlanIdeaSet = {
        temporality: raw.temporality,
        scheduledDate: raw.scheduled_date,
        funnelStage: raw.funnel_stage as FunnelStage,
        channel: raw.channel,
        targetEmotion: raw.target_emotion,
        product: raw.product,
        ideas: [{
          type: raw.idea_type as IdeaType,
          name: raw.name,
          summary: raw.hook,
          contentType: raw.format,
          funnelObjective: raw.funnel_stage,
          hook: raw.hook,
          hookType: '',
          higgsfieldPrompt: raw.higgsfield_prompt || '',
          development: raw.content,
          cta: raw.cta,
          kpi: raw.kpi ?? '',
          whyWorks: '',
          benchmarkReference: '',
        }],
      }
      return {
        temporality: raw.temporality,
        scheduledDate: raw.scheduled_date,
        funnelStage: raw.funnel_stage as FunnelStage,
        objective: raw.funnel_stage,
        idea: null,
        format: null,
        channel: raw.channel,
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
