import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const maxDuration = 60
import { getPlanWithItems, insertPlanItems } from '@/services/content-plans.service'
import { getBrandWithSetup } from '@/services/brands.service'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'
import type { FunnelStage } from '@/types/domain'

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
      `- Producto/servicio: "${p.name}"\n  Descripción: ${p.description}\n  Objetivo de funnel: ${p.objective}`
    ).join('\n')

    const prompt = `Eres un estratega de contenidos experto en marketing digital para mercado latinoamericano, especializado en Ecuador.

## MARCA
- Nombre: ${brand.name}
- Voz: ${brand.voice || 'No definida'}
- Tono: ${brand.tone || 'No definido'}
- Audiencia objetivo: ${brand.targetAudience || 'No definida'}
- Propuesta de valor: ${brand.valueProposition || 'No definida'}
- Pilares de contenido: ${brand.contentPillars?.join(', ') || 'No definidos'}
- Restricciones: ${brand.restrictions?.join(', ') || 'Ninguna'}

## PLAN DEL MES
Mes: ${monthName} ${plan.year}
${plan.context ? `Contexto adicional: ${plan.context}` : ''}

## PRODUCTOS/SERVICIOS A PROMOVER
${productsText}

## FECHAS RELEVANTES EN ECUADOR — ${monthName}
${ecuadorDates}

## INSTRUCCIONES
Genera un plan de contenidos estratégico para este mes. El plan debe:

1. Responder a un funnel claro con las etapas: awareness → consideration → conversion → retention
2. Incluir SOLO los contenidos necesarios para que el funnel funcione (no saturar, máximo 12-16 piezas por mes)
3. Conectar con fechas relevantes de Ecuador cuando sea natural y aporte valor a la marca
4. Para contenido de Meta (Instagram/Facebook): especificar estructura con hook, zona segura, CTA visible, formato vertical, uso de sonido
5. Definir KPI específico por pieza según su función en el funnel
6. Distribuir los contenidos a lo largo del mes con temporalidad específica
7. Incluir referencia benchmark (tipo de contenido, no marca específica) para orientar la producción

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con este formato exacto:
[
  {
    "temporality": "Semana 1 — Lunes 3",
    "scheduled_date": "${plan.year}-${String(plan.month).padStart(2,'0')}-03",
    "funnel_stage": "awareness",
    "objective": "Presentar el nuevo plan con Disney+ a audiencia fría",
    "idea": "Reel mostrando qué se puede ver en Disney+ con el plan",
    "format": "Reel",
    "channel": "Instagram",
    "kpi": "Reproducciones, Alcance",
    "benchmark_reference": "Reels de telcos con alianzas de entretenimiento — formato antes/después del entretenimiento en casa",
    "main_message": "Tu internet ahora incluye Disney+",
    "cta": "Desliza para ver los planes",
    "observations": "Hook primeros 3s: mostrar pantalla con Disney+. Zona segura inferior para CTA. Audio original + voz en off."
  }
]

Genera entre 10 y 16 piezas de contenido bien distribuidas a lo largo del mes.`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Claude no devolvió JSON válido')

    const generated = JSON.parse(jsonMatch[0]) as Array<{
      temporality: string
      scheduled_date: string | null
      funnel_stage: string
      objective: string
      idea: string
      format: string
      channel: string
      kpi: string
      benchmark_reference: string
      main_message: string
      cta: string
      observations: string
    }>

    // Delete existing items before inserting new ones
    await db.from('content_plan_items').delete().eq('plan_id', planId)

    const items = await insertPlanItems(db, planId, generated.map(g => ({
      temporality: g.temporality,
      scheduledDate: g.scheduled_date,
      funnelStage: g.funnel_stage as FunnelStage,
      objective: g.objective,
      idea: g.idea,
      format: g.format,
      channel: g.channel,
      kpi: g.kpi,
      benchmarkReference: g.benchmark_reference,
      mainMessage: g.main_message,
      cta: g.cta,
      observations: g.observations,
      status: 'draft' as const,
      sortOrder: 0,
    })))

    return NextResponse.json({ data: items })
  } catch (err) {
    return errorResponse(err)
  }
}
