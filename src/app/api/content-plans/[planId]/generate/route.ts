import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const maxDuration = 300
import { getPlanWithItems, insertPlanItems } from '@/services/content-plans.service'
import { getBrandWithSetup } from '@/services/brands.service'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'
import type { FunnelStageV2, PlanIdeaSet, IdeaType, FunnelDistribution, ContentCategory, ProductionType, ConversionChannel } from '@/types/domain'

const DEFAULT_DISTRIBUTION: FunnelDistribution = { presentacion: 40, evaluacion: 35, conversion: 25 }

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
  content_category: string
  production_type: string
  conversion_channel: string | null
  target_audience: string | null
  name: string
  hook: string
  hook_options: Array<{ type: string; text: string; why: string }>
  selected_hook_type: string
  selected_hook_reason: string
  limiting_belief: string
  motivator: string
  creative_reference: string
  native_resource: string
  alternate_ctas: Array<{ method: string; cta: string; closing: string }>
  higgsfield_prompt: string
  content: string
  cta: string
  kpi: string
}

function distributePieces(total: number, dist: FunnelDistribution): { presentacion: number; evaluacion: number; conversion: number } {
  const p = Math.round(total * dist.presentacion / 100)
  const e = Math.round(total * dist.evaluacion / 100)
  const c = total - p - e
  return { presentacion: p, evaluacion: e, conversion: Math.max(0, c) }
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
    const dist = plan.funnelDistribution ?? DEFAULT_DISTRIBUTION
    const PIECES_PER_PRODUCT = 7
    const counts = distributePieces(PIECES_PER_PRODUCT, dist)
    const totalPieces = numProducts * PIECES_PER_PRODUCT

    const channelList = (plan.channelMix ?? []).join(', ') || 'Instagram'
    const mm = String(plan.month).padStart(2, '0')
    const yy = plan.year

    const pillars = Array.isArray(brand.puntosClave) && brand.puntosClave.length
      ? brand.puntosClave.join(' · ')
      : null

    const productsDetail = products.map((p, i) => {
      const methods = p.leadMethods?.length ? p.leadMethods : p.leadMethod ? [p.leadMethod] : []
      const methodText = methods.length === 0 ? ''
        : methods.length === 1 ? ` — captura de lead via: ${methods[0]}`
        : ` — captura de lead via MÚLTIPLES MÉTODOS: ${methods.join(', ')} → generar alternate_ctas`
      const lines = [`${i + 1}. "${p.name}": ${p.description}${p.objective ? ` — objetivo: ${p.objective}` : ''}${methodText}`]
      if (p.promotion) lines.push(`   Promoción: ${p.promotion}`)
      if (p.currentPrice) lines.push(`   Precio: ${p.currentPrice}${p.previousPrice ? ` (antes: ${p.previousPrice})` : ''}`)
      if (p.keyBenefits?.length) lines.push(`   Beneficios: ${p.keyBenefits.join(', ')}`)
      if (p.differentials) lines.push(`   Diferenciadores: ${p.differentials}`)
      if (p.communicationMandatories?.length) lines.push(`   DEBE incluir: ${p.communicationMandatories.join(' / ')}`)
      if (p.legalRestrictions) lines.push(`   Restricción legal: ${p.legalRestrictions}`)
      if (p.websiteUrl) lines.push(`   Web: ${p.websiteUrl}`)
      const audNames = p.audiences?.length ? p.audiences : null
      if (audNames?.length) lines.push(`   Audiencias objetivo: ${audNames.join(', ')}`)
      return lines.join('\n')
    }).join('\n\n')

    const audiencesSection = plan.audiences?.length
      ? `\n═══ AUDIENCIAS DEL PLAN ═══\n${plan.audiences.map(a => {
          const lines = [`• ${a.name}${a.description ? ` — ${a.description}` : ''}`]
          if (a.beliefs?.length) lines.push(`  Creencias limitantes: ${a.beliefs.join(' / ')}`)
          if (a.pains?.length) lines.push(`  Dolores: ${a.pains.join(' / ')}`)
          if (a.jtbd?.length) lines.push(`  Quieren lograr: ${a.jtbd.join(' / ')}`)
          return lines.join('\n')
        }).join('\n')}\n`
      : ''

    const prompt = `Eres el mejor estratega creativo de contenidos para marcas en Ecuador y Latinoamérica. Dominas los frameworks Stop/Think/Act, Pitch/Play/Plan y todas las reglas de plataforma Meta. Generas ideas concretas, originales y listas para producción — nada genérico.

═══ MARCA ═══
Nombre: ${brand.name}
Descripción: ${brand.descripcion || 'N/A'}
Concepto comunicacional: ${brand.conceptoComunicacional || 'N/A'}
Propuesta de valor: ${brand.valueProposition || 'N/A'}
Tono y estilo: ${brand.tonoEstilo || 'N/A'}
${pillars ? `Puntos clave: ${pillars}` : ''}
${brand.mandatoriosGenerales?.length ? `Mandatorios (siempre incluir): ${brand.mandatoriosGenerales.join(' / ')}` : ''}
${brand.competidores?.length ? `Competidores: ${brand.competidores.join(', ')}` : ''}
${brand.audienciasMarca?.length ? `\n═══ AUDIENCIAS DE LA MARCA ═══\n${(brand.audienciasMarca as Array<{ name: string; description?: string; beliefs?: string[]; pains?: string[]; jtbd?: string[] }>).map(a => {
  const lines = [`• ${a.name}${a.description ? ` — ${a.description}` : ''}`]
  if (a.beliefs?.length) lines.push(`  Creencias: ${a.beliefs.join(' / ')}`)
  if (a.pains?.length) lines.push(`  Dolores: ${a.pains.join(' / ')}`)
  if (a.jtbd?.length) lines.push(`  Quieren lograr: ${a.jtbd.join(' / ')}`)
  return lines.join('\n')
}).join('\n')}` : ''}
${audiencesSection}
═══ MES ═══
${monthName} ${yy} | Fechas clave Ecuador: ${ecuadorDates}

═══ BRIEF ESTRATÉGICO DEL MES ═══
${plan.strategicBrief ?? ''}

═══ CANALES ACTIVOS (SOLO estos) ═══
${channelList}

PRODUCTOS:
${productsDetail}

INSTRUCCIÓN:
Construye un funnel de contenido ESPECÍFICO para cada producto. NO mezcles productos en una misma pieza.
Por cada producto genera exactamente ${PIECES_PER_PRODUCT} piezas distribuidas en 3 etapas:
- presentacion (${counts.presentacion} pieza${counts.presentacion !== 1 ? 's' : ''}, Sem 1-2): Primera toma de contacto — presentar el producto, despertar curiosidad, crear primera impresión positiva.
- evaluacion (${counts.evaluacion} pieza${counts.evaluacion !== 1 ? 's' : ''}, Sem 2-3): Prospecto en evaluación activa — resolver dudas, mostrar beneficios concretos, prueba social, comparaciones, testimonios.
- conversion (${counts.conversion} pieza${counts.conversion !== 1 ? 's' : ''}, Sem 3-4): Prospecto listo para actuar — urgencia, última oportunidad, oferta concreta, eliminar última barrera.

TOTAL: ${numProducts} producto(s) × ${PIECES_PER_PRODUCT} = ${totalPieces} piezas

Genera UNA idea por pieza, completamente desarrollada y lista para producción.
FORMATOS: Reel | Carrusel | Post estático | Historia | Google Search Ad | Google Display

CAPTURA DE LEADS:
Un solo método → adapta el CTA al método indicado:
- Formulario de Meta → "Completa el formulario" (nativo Meta)
- Landing page → "Visita nuestra web" (incluye URL display)
- WhatsApp → "Escríbenos al WhatsApp" (link wa.me)
- Messenger → "Envíanos un mensaje"
- DM de Instagram → "Escríbenos un DM"
- Llamada telefónica → "Llámanos"

MÚLTIPLES MÉTODOS → misma idea con cierres alternativos:
- Genera alternate_ctas: un objeto por método: [{"method":"WhatsApp","cta":"Escríbenos","closing":"[descripción escena final]"}, ...]

REGLAS DE PLATAFORMA META:
1. FORMATO 9:16: Todo social es vertical. Texto en zona segura central (evitar 15% superior e inferior).
2. HOOK EN 3s: La marca aparece antes del segundo 3. Diversifica: visual (movimiento/sorpresa), texto (pregunta/dato), trending (formato viral).
3. SONIDO COMO NARRATIVA: Primero sin sonido (texto en pantalla). Luego voz o audio que aporte significado.
4. LENGUAJE NATIVO: Conversacional, directo, no locución televisiva.
5. SHAREABILITY: Dato sorprendente, insight útil, humor, identificación o revelación inesperada.
6. CTA VISIBLE EN PANTALLA: El CTA aparece escrito dentro del creativo.

MAPA EMOCIONAL POR ETAPA:
- presentacion → target_emotion: Curiosidad | Sorpresa | Intriga
- evaluacion → target_emotion: Confianza | Aspiración | Identificación
- conversion → target_emotion: Urgencia | Validación social | FOMO

PSICOLOGÍA POR PIEZA:
- limiting_belief: la creencia limitante ESPECÍFICA en voz del cliente. Ej: "Es muy caro para lo que hace". Real, no genérica.
- motivator: el deseo o dolor CONCRETO. Ej: "Verse profesional frente a clientes sin gastar una fortuna". Específico.

REFERENTE CREATIVO: creative_reference — elige uno: "UGC storytelling natural" | "Meta Creative directo" | "Big Idea aspiracional" | "Social proof con urgencia" | "Tutorial disruptivo" | "Mito vs Realidad" | "Transformación antes/después" | "Tensión humana emocional" | "Simplicidad + emoción Apple-style"

RECURSO NATIVO: native_resource — ej: "POV", "Talking head creator", "Split screen", "Before/After", "Lista rápida", "Storytime", "UGC testimonial", "Tutorial paso a paso", "" (para no-video).

MÚLTIPLES HOOKS (para cada pieza):
- hook_options: exactamente 3 opciones [{type:"visual",text:"...",why:"..."},{type:"texto",text:"...",why:"..."},{type:"trending",text:"...",why:"..."}]
- selected_hook_type: "visual" | "texto" | "trending"
- selected_hook_reason: 1 oración por qué es el más fuerte
- hook: texto exacto del hook seleccionado (máx 10 palabras)

CLASIFICACIÓN POR PIEZA:
- content_category: "social" (Instagram/Facebook/TikTok) | "sem" (Google Search) | "display" (Google Display/banners) | "blog" (artículo SEO)
- production_type: "stock" | "produccion_propia" | "diseno_grafico" | "imagen_referencial" | "video_grabado" | "animacion"
- conversion_channel: solo para etapa "conversion" → "whatsapp" | "landing_page" | "sitio_web" | "formulario_meta" | "app" | null
- target_audience: nombre de la audiencia objetivo de esta pieza (de las audiencias del plan) | null

CONTENIDO POR FORMATO:
Reel/Historia → content="HOOK TYPE: [visual|texto|trending]\\nAUDIO: [música o voz]\\nESC1 (Xs): Visual:[...] | Voz:[...] | Pantalla:[texto obligatorio]\\nESC2 (Xs): Visual:[...] | Voz:[...] | Pantalla:[...]\\nESC3 (Xs): Visual:[...] | Voz:[...] | Pantalla:[CTA visible]\\nDURACIÓN: Xs | MOMENTO: [Pitch|Plan]\\nSHAREABILITY: [motivo concreto]"
Carrusel → content="S1 HOOK: [titular alto impacto] | Visual:[...]\\nS2: [texto] | Visual:[...]\\nS3: [texto] | Visual:[...]\\nS4: [texto] | Visual:[...]\\nS5 CTA: [CTA visible en imagen] | Visual:[...]\\nSHAREABILITY: [motivo]"
Post estático → content="TITULAR: [...]\\nCUERPO: [caption 2-3 oraciones]\\nVISUAL: [descripción imagen en zona segura]\\nCTA EN IMAGEN: [texto dentro del gráfico]"
Google Search Ad → content="T1: [...](≤30c)\\nT2: [...](≤30c)\\nT3: [...](≤30c)\\nD1: [...](≤90c)\\nD2: [...](≤90c)\\nURL: [dominio/ruta]"
Google Display → content="TITULAR: [...]\\nCUERPO: [texto breve]\\nCTA: [texto botón]\\nVISUAL: [descripción banner]"

REGLAS JSON:
- idea_type: presentacion→disruptiva | evaluacion→aspiracional | conversion→racional
- name: 3 palabras máx | cta: 5 palabras máx | kpi: 2 palabras máx
- higgsfield_prompt: SOLO Reel/Historia — movimiento cámara + atmósfera + luz ("" para el resto)
- channel: SOLO de la lista activa

JSON — solo el array sin markdown:
[{"product":"nombre producto","funnel_stage":"presentacion","temporality":"Sem 1 — ${monthName} 3","scheduled_date":"${yy}-${mm}-03","channel":"Instagram","target_emotion":"Curiosidad","idea_type":"disruptiva","format":"Reel","content_category":"social","production_type":"video_grabado","conversion_channel":null,"target_audience":null,"name":"Tres palabras concepto","limiting_belief":"Es muy caro para lo que hace","motivator":"Verse profesional sin gastar una fortuna","creative_reference":"Meta Creative directo","native_resource":"Talking head creator","hook_options":[{"type":"visual","text":"Primer plano manos sosteniendo producto inesperado","why":"El movimiento fuerza el pause"},{"type":"texto","text":"Esto nadie te lo dice.","why":"Activa curiosidad y FOMO"},{"type":"trending","text":"POV: encontraste lo que buscabas","why":"Formato POV tiene alto engagement"}],"selected_hook_type":"texto","selected_hook_reason":"La promesa de secreto genera más clicks en presentación","hook":"Esto nadie te lo dice.","higgsfield_prompt":"Zoom rápido a rostro sorprendido, luz lateral dramática, fondo desenfocado","alternate_ctas":[],"content":"HOOK TYPE: texto\\nAUDIO: música tensa que corta al silencio en ESC2\\nESC1 (3s): Visual:[primer plano producto] | Voz:[¿Cuánto tiempo llevas buscando esto?] | Pantalla:[Esto nadie te lo dice.]\\nESC2 (12s): Visual:[demo en acción] | Voz:[Con X logras Y en Z días] | Pantalla:[Beneficio principal]\\nESC3 (5s): Visual:[resultado + logo] | Voz:[Empieza hoy] | Pantalla:[Escríbenos ahora →]\\nDURACIÓN: 20s | MOMENTO: Pitch\\nSHAREABILITY: dato sorprendente que querrán reenviar","cta":"Escríbenos hoy mismo","kpi":"Reproducciones"}]`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: 'Eres un generador de JSON para estrategia de contenidos. Responde ÚNICAMENTE con un array JSON válido. Sin markdown, sin bloques de código. Empieza con [ y termina con ].',
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    if (message.stop_reason === 'max_tokens') {
      throw new Error(`La respuesta fue demasiado larga y se cortó. Intenta con menos productos (máximo 2).`)
    }
    const stripped = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = stripped.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error(`Respuesta inválida del modelo: ${stripped.slice(0, 200)}`)

    const generated = JSON.parse(jsonMatch[0].replace(/,\s*([\]}])/g, '$1')) as RawPiece[]

    await db.from('content_plan_items').delete().eq('plan_id', planId)

    const items = await insertPlanItems(db, planId, generated.map((raw, i) => {
      const ideaSet: PlanIdeaSet = {
        temporality: raw.temporality,
        scheduledDate: raw.scheduled_date,
        funnelStage: raw.funnel_stage as FunnelStageV2,
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
          hookType: raw.selected_hook_type || '',
          hookOptions: raw.hook_options || [],
          selectedHookReason: raw.selected_hook_reason || '',
          limitingBelief: raw.limiting_belief || '',
          motivator: raw.motivator || '',
          creativeReference: raw.creative_reference || '',
          nativeResource: raw.native_resource || '',
          alternateCtas: raw.alternate_ctas || [],
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
        funnelStage: raw.funnel_stage as FunnelStageV2,
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
        contentCategory: (raw.content_category || null) as ContentCategory | null,
        productionType: (raw.production_type || null) as ProductionType | null,
        conversionChannel: (raw.conversion_channel || null) as ConversionChannel | null,
        targetAudience: raw.target_audience || null,
      }
    }))

    return NextResponse.json({ data: items })
  } catch (err) {
    return errorResponse(err)
  }
}
