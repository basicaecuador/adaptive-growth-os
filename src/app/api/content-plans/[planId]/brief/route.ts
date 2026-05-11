import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPlanWithItems, updatePlan } from '@/services/content-plans.service'
import { getBrandWithSetup } from '@/services/brands.service'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'
import type { FunnelDistribution } from '@/types/domain'

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

const DEFAULT_DISTRIBUTION: FunnelDistribution = { presentacion: 40, evaluacion: 35, conversion: 25 }

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
    const funnelDistribution: FunnelDistribution = body.funnelDistribution ?? DEFAULT_DISTRIBUTION
    const piecesCount: number = body.piecesCount ?? 12

    const db = createAdminClient()
    const { plan } = await getPlanWithItems(db, planId)
    const brand = await getBrandWithSetup(db, plan.brandId)

    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const monthName = monthNames[plan.month - 1]
    const ecuadorDates = ECUADOR_DATES[plan.month]?.join('\n') ?? ''

    const dist = funnelDistribution
    const pPct = dist.presentacion
    const ePct = dist.evaluacion
    const cPct = dist.conversion

    const pPieces = Math.round(piecesCount * pPct / 100)
    const ePieces = Math.round(piecesCount * ePct / 100)
    const cPieces = piecesCount - pPieces - ePieces

    const stages = dist.stages
    const stageLines = stages?.length === 3
      ? [
          `- Presentación: ${pPieces} piezas (${pPct}%) | Canales: ${stages[0].channels.join(', ') || 'No especificados'}${stages[0].notes ? ` | Notas: ${stages[0].notes}` : ''}`,
          `- Evaluación: ${ePieces} piezas (${ePct}%) | Canales: ${stages[1].channels.join(', ') || 'No especificados'}${stages[1].notes ? ` | Notas: ${stages[1].notes}` : ''}`,
          `- Conversión: ${cPieces} piezas (${cPct}%) | Canales: ${stages[2].channels.join(', ') || 'No especificados'}${stages[2].conversionChannel ? ` | Canal de cierre: ${stages[2].conversionChannel}` : ''}${stages[2].notes ? ` | Notas: ${stages[2].notes}` : ''}`,
        ].join('\n')
      : `- Presentación: ${pPieces} piezas (${pPct}%)\n- Evaluación: ${ePieces} piezas (${ePct}%)\n- Conversión: ${cPieces} piezas (${cPct}%) | Canales: ${channelMix.join(', ') || 'No especificados'}`

    const channelMixByStage = stages?.length === 3
      ? stages.flatMap(s => s.channels).filter((v, i, a) => a.indexOf(v) === i)
      : channelMix

    const productsText = plan.products.map((p, idx) => {
      const lines = [`${idx + 1}. **${p.name}** — ${p.description}`]
      if (p.objective) lines.push(`   Objetivo: ${p.objective}`)
      if (p.promotion) lines.push(`   Promoción vigente: ${p.promotion}`)
      if (p.currentPrice) lines.push(`   Precio: ${p.currentPrice}${p.previousPrice ? ` (antes ${p.previousPrice})` : ''}`)
      if (p.keyBenefits?.length) lines.push(`   Beneficios clave: ${p.keyBenefits.join(', ')}`)
      if (p.differentials) lines.push(`   Diferenciadores: ${p.differentials}`)
      if (p.legalRestrictions) lines.push(`   Restricciones legales: ${p.legalRestrictions}`)
      return lines.join('\n')
    }).join('\n\n')

    const audiencesText = plan.audiences?.length
      ? plan.audiences.map((a, idx) => {
          const lines = [`${idx + 1}. **${a.name}**${a.age ? ` (${a.age})` : ''}`]
          if (a.description) lines.push(`   ${a.description}`)
          if (a.interests?.length) lines.push(`   Intereses: ${a.interests.join(' · ')}`)
          if (a.beliefs?.length) lines.push(`   Creencias: ${a.beliefs.join(' · ')}`)
          if (a.pains?.length) lines.push(`   Dolores: ${a.pains.join(' · ')}`)
          if (a.jtbd?.length) lines.push(`   Quieren lograr: ${a.jtbd.join(' · ')}`)
          return lines.join('\n')
        }).join('\n\n')
      : null

    const prompt = `Eres un estratega de contenidos senior especializado en marketing digital para Ecuador y Latinoamérica.

## MARCA
- Nombre: ${brand.name}
- Descripción: ${brand.descripcion || 'No definida'}
- Concepto comunicacional: ${brand.conceptoComunicacional || 'No definido'}
- Propuesta de valor: ${brand.valueProposition || 'No definida'}
- Tono y estilo: ${brand.tonoEstilo || 'No definido'}
- Puntos clave de comunicación: ${brand.puntosClave?.join(', ') || 'No definidos'}
- Mandatorios generales: ${brand.mandatoriosGenerales?.join(', ') || 'Ninguno'}
- Canales disponibles: ${brand.redesDisponibles?.map((r: { red: string; usuario: string }) => r.usuario ? `${r.red} (${r.usuario})` : r.red).join(', ') || 'No especificados'}
- Competidores: ${brand.competidores?.join(', ') || 'No especificados'}
${brand.audienciasMarca?.length ? `\n## AUDIENCIAS DE LA MARCA\n${brand.audienciasMarca.map((a: { name: string; description?: string; beliefs?: string[]; pains?: string[]; jtbd?: string[] }, idx: number) => {
  const lines = [`${idx + 1}. **${a.name}**`]
  if (a.description) lines.push(`   ${a.description}`)
  if (a.beliefs?.length) lines.push(`   Creencias: ${a.beliefs.join(' · ')}`)
  if (a.pains?.length) lines.push(`   Dolores: ${a.pains.join(' · ')}`)
  if (a.jtbd?.length) lines.push(`   Quieren lograr: ${a.jtbd.join(' · ')}`)
  return lines.join('\n')
}).join('\n\n')}` : ''}

## PLAN DE ${monthName.toUpperCase()} ${plan.year}
${plan.context ? `Contexto de negocio: ${plan.context}\n` : ''}
Productos/servicios a promover:
${productsText}
${audiencesText ? `\n## AUDIENCIAS OBJETIVO\n${audiencesText}\n` : ''}
## PARÁMETROS ESTRATÉGICOS
- Volumen objetivo: ${piecesCount} piezas de contenido
- Distribución del funnel por etapa:
${stageLines}

## FECHAS RELEVANTES EN ECUADOR — ${monthName}
${ecuadorDates}

## TU TAREA
Genera un brief estratégico para este mes. El brief debe ser conciso, orientado a acción y justificar las decisiones de distribución. Usa este formato exacto:

### Análisis del mes
[2-3 oraciones: qué hace especial a este mes para esta marca en Ecuador. Contexto cultural, competitivo o de negocio relevante.]

### Distribución del funnel
Justifica la distribución de ${piecesCount} piezas en las 3 etapas del customer journey:
- Presentación: ${pPieces} piezas — [razón táctica + qué canales se usarán]
- Evaluación: ${ePieces} piezas — [razón táctica + qué argumentos construimos]
- Conversión: ${cPieces} piezas — [razón táctica + canal de cierre elegido y por qué]

### Ejes temáticos
Los 3-4 grandes temas que deben dominar el mes. Cada eje conecta la marca con algo relevante para la audiencia.
1. **[Nombre del eje]** — [descripción de 1 línea]
2. **[Nombre del eje]** — [descripción de 1 línea]
3. **[Nombre del eje]** — [descripción de 1 línea]
4. **[Nombre del eje]** — [descripción de 1 línea]

### Momentos clave a aprovechar
[2-4 fechas o momentos específicos del mes con una idea de acción concreta. Solo los que realmente aplican a esta marca.]

### Mix por canal
${channelMixByStage.map(ch => `- **${ch}**: [número] piezas — [tipos de contenido recomendados y etapa principal]`).join('\n')}

### Psicología de la audiencia objetivo
La materia prima emocional del mes — lo que la audiencia cree, teme y desea en relación a esta marca y sus productos.

**Creencias limitantes a romper:**
- [Creencia 1 — específica y en voz del cliente. Ej: "Es muy caro para lo que ofrece"]
- [Creencia 2]

**Miedos no verbalizados:**
- [Miedo 1 — interno. Ej: "Que no me funcione a mí como a otros"]
- [Miedo 2]

**Motivadores y deseos concretos:**
- [Motivador 1 — específico. Ej: "Verse profesional frente a clientes sin gastar una fortuna"]
- [Motivador 2]

**Insight del mes:**
[El momento exacto en que la audiencia dice "esto es justo lo que necesito". El insight que debe atravesar todo el contenido del mes.]

### Referentes creativos por etapa
- **Presentación:** [Enfoque creativo] — [por qué conecta con esta audiencia ahora]
- **Evaluación:** [Enfoque creativo] — [razón]
- **Conversión:** [Enfoque creativo] — [razón]

Opciones de referentes: UGC storytelling natural | Meta Creative directo | Big Idea aspiracional | Social proof con urgencia | Tutorial disruptivo | Mito vs Realidad | Transformación antes/después | Tensión humana emocional | Apple simplicidad + emoción

Responde solo con el brief, sin texto adicional antes ni después.`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
    })

    const brief = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    if (!brief) throw new Error('No se pudo generar el brief')

    const updatedPlan = await updatePlan(db, planId, {
      strategicBrief: brief,
      channelMix,
      funnelDistribution,
      piecesCount,
    })

    return NextResponse.json({ data: updatedPlan })
  } catch (err) {
    return errorResponse(err)
  }
}
