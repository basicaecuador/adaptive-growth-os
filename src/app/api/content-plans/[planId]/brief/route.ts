import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPlanWithItems, updatePlan } from '@/services/content-plans.service'
import { getBrandWithSetup } from '@/services/brands.service'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export const maxDuration = 300

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

const FUNNEL_FOCUS_LABELS: Record<string, string> = {
  balanced: 'Equilibrado — distribución balanceada entre todas las etapas del funnel',
  awareness: 'Priorizar awareness — más piezas de captación y alcance',
  conversion: 'Priorizar conversión — enfoque en ventas y leads directos',
  retention: 'Priorizar retención — fidelización de clientes actuales',
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await params
    const body = await req.json()
    const channelMix: string[] = body.channelMix ?? []
    const funnelFocus: string = body.funnelFocus ?? 'balanced'
    const piecesCount: number = body.piecesCount ?? 12

    const db = createAdminClient()
    const { plan } = await getPlanWithItems(db, planId)
    const brand = await getBrandWithSetup(db, plan.brandId)

    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const monthName = monthNames[plan.month - 1]
    const ecuadorDates = ECUADOR_DATES[plan.month]?.join('\n') ?? ''

    const productsText = plan.products.map(p =>
      `- ${p.name}${p.description ? ` — ${p.description}` : ''} (Objetivo: ${p.objective})`
    ).join('\n')

    const prompt = `Eres un estratega de contenidos senior especializado en marketing digital para Ecuador y Latinoamérica.

## MARCA
- Nombre: ${brand.name}
- Voz: ${brand.voice || 'No definida'}
- Tono: ${brand.tone || 'No definido'}
- Audiencia: ${brand.targetAudience || 'No definida'}
- Propuesta de valor: ${brand.valueProposition || 'No definida'}
- Pilares de contenido: ${brand.contentPillars?.join(', ') || 'No definidos'}
- Restricciones: ${brand.restrictions?.join(', ') || 'Ninguna'}

## PLAN DE ${monthName.toUpperCase()} ${plan.year}
${plan.context ? `Contexto de negocio: ${plan.context}\n` : ''}
Productos/servicios a promover:
${productsText}

## PARÁMETROS ESTRATÉGICOS
- Canales seleccionados: ${channelMix.join(', ') || 'No especificados'}
- Enfoque del funnel: ${FUNNEL_FOCUS_LABELS[funnelFocus] || funnelFocus}
- Volumen objetivo: ${piecesCount} piezas de contenido

## FECHAS RELEVANTES EN ECUADOR — ${monthName}
${ecuadorDates}

## TU TAREA
Genera un brief estratégico para este mes. El brief debe ser conciso, orientado a acción, y justificar las decisiones de distribución. Usa este formato exacto:

### Análisis del mes
[2-3 oraciones: qué hace especial a este mes para esta marca en Ecuador. Contexto cultural, competitivo o de negocio relevante.]

### Distribución del funnel
Distribuye las ${piecesCount} piezas entre las 4 etapas. Justifica brevemente cada número.
- Awareness: X piezas — [razón]
- Consideración: X piezas — [razón]
- Conversión: X piezas — [razón]
- Remarketing: X piezas — [razón]

### Ejes temáticos
Los 4 grandes temas que deben dominar el mes. Cada eje debe conectar la marca con algo relevante para la audiencia.
1. **[Nombre del eje]** — [descripción de 1 línea]
2. **[Nombre del eje]** — [descripción de 1 línea]
3. **[Nombre del eje]** — [descripción de 1 línea]
4. **[Nombre del eje]** — [descripción de 1 línea]

### Momentos clave a aprovechar
[2-4 fechas o momentos específicos del mes con una idea de acción concreta para cada uno. Solo los que realmente aplican a esta marca.]

### Mix por canal
${channelMix.map(ch => `- **${ch}**: [número] piezas — [tipos de contenido recomendados]`).join('\n')}

Responde solo con el brief, sin texto adicional antes ni después.`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const brief = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    if (!brief) throw new Error('No se pudo generar el brief')

    const updatedPlan = await updatePlan(db, planId, {
      strategicBrief: brief,
      channelMix,
      funnelFocus,
      piecesCount,
    })

    return NextResponse.json({ data: updatedPlan })
  } catch (err) {
    return errorResponse(err)
  }
}
