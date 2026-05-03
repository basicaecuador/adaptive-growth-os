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

    const prompt = `Estratega de contenidos para Ecuador/Latam. Framework Stop/Think/Act + Reglas de plataforma Meta.

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

REGLAS DE PLATAFORMA META (obligatorio para Reel/Historia/Carrusel/Post):
1. FORMATO 9:16: Todo contenido social es vertical. Texto y marca en zona segura central (evitar 15% superior e inferior).
2. HOOK EN 3s: Los primeros 3 segundos determinan si sigue o no. La marca debe aparecer antes del segundo 3. Diversifica tipos de hook: visual (movimiento/color/sorpresa), texto (pregunta/dato/promesa en pantalla), trending (formato viral reconocible).
3. SONIDO COMO NARRATIVA: Diseña primero para sin sonido (texto en pantalla siempre). Luego enriquece con voz en off o audio que aporte significado, no solo de fondo.
4. LENGUAJE NATIVO: Habla como humano de la plataforma, no como anuncio de televisión. Tono conversacional, directo, sin locuciones comerciales genéricas.
5. SHAREABILITY: Cada pieza necesita un motivo de compartir — dato sorprendente, insight útil, humor, identificación, ahorro de tiempo, o revelación inesperada.
6. PITCH/PLAY/PLAN: Pitch=<10s micro-mensaje de urgencia | Play=carrusel interactivo para explorar | Plan=Reel >30s estilo creator con narración/tutorial/transformación.
7. CTA VISIBLE EN PANTALLA: El CTA debe aparecer escrito dentro del creativo (texto en pantalla o slide final), no solo en el caption o botón de interfaz.

MAPA EMOCIONAL POR ETAPA:
- awareness → target_emotion: Curiosidad | Sorpresa | Asombro
- consideration → target_emotion: Confianza | Aspiración | Identificación
- conversion → target_emotion: Urgencia | Validación social | FOMO
- remarketing → target_emotion: Reactivación | Oportunidad perdida | Nostalgia

CONTENIDO REQUERIDO POR FORMATO:

Reel/Historia → Define momento Pitch/Play/Plan. Hook type explícito. Audio como elemento narrativo. Texto en pantalla en CADA escena. CTA visible en última escena.
content="HOOK TYPE: [visual|texto|trending]\nAUDIO: [descripción música o voz en off]\nESC1 (Xs): Visual:[...] | Voz:[texto hablado] | Pantalla:[texto en pantalla obligatorio]\nESC2 (Xs): Visual:[...] | Voz:[...] | Pantalla:[...]\nESC3 (Xs): Visual:[...] | Voz:[...] | Pantalla:[CTA visible en pantalla]\nDURACIÓN: Xs | MOMENTO: [Pitch|Plan]\nSHAREABILITY: [motivo concreto por el que se comparte]"

Carrusel → Momento Play. S1 = hook visual con texto de alto impacto. Última slide = CTA visible en imagen.
content="S1 HOOK: [texto titular de alto impacto] | Visual:[...]\nS2: [texto] | Visual:[...]\nS3: [texto] | Visual:[...]\nS4: [texto] | Visual:[...]\nS5 CTA: [texto CTA visible en la imagen] | Visual:[...]\nSHAREABILITY: [motivo concreto]"

Post estático → Zona segura. Texto principal legible en imagen. CTA escrito dentro del gráfico.
content="TITULAR: [...]\nCUERPO: [caption completo, 2-3 oraciones con tono conversacional de marca]\nVISUAL: [descripción de imagen, elementos en zona segura central]\nCTA EN IMAGEN: [texto visible dentro del gráfico]"

Google Search Ad → content="T1: [...](≤30c)\nT2: [...](≤30c)\nT3: [...](≤30c)\nD1: [...](≤90c)\nD2: [...](≤90c)\nURL: [dominio/ruta]"

Google Display → content="TITULAR: [...]\nCUERPO: [texto breve]\nCTA: [texto botón]\nVISUAL: [descripción banner]"

REGLAS JSON:
- channel: SOLO canales de la lista activa
- higgsfield_prompt: SOLO para Reel/Historia — describe movimiento de cámara + atmósfera visual + dirección de luz ("" para el resto)
- hook (10 palabras máx): video→describe los primeros 3s visuales | resto→titular impactante
- idea_type: awareness→disruptiva | consideration→aspiracional | conversion/remarketing→racional
- name: 3 palabras máx | cta: 5 palabras máx | kpi: 2 palabras máx

JSON — solo el array sin markdown:
[{"product":"nombre exacto producto","funnel_stage":"awareness","temporality":"Sem 1 — ${monthName} 3","scheduled_date":"${yy}-${mm}-03","channel":"Instagram","target_emotion":"Curiosidad","idea_type":"disruptiva","format":"Reel","name":"Tres palabras concepto","hook":"Primer plano manos sosteniendo producto inesperado","higgsfield_prompt":"Zoom rápido a rostro sorprendido, luz lateral dramática, fondo desenfocado","content":"HOOK TYPE: visual\\nAUDIO: música tensa que corta al silencio en ESC2\\nESC1 (3s): Visual:[primer plano manos sosteniendo producto] | Voz:[¿Cuánto tiempo llevas buscando esto?] | Pantalla:[Esto existe.]\\nESC2 (12s): Visual:[demo en acción ángulo cenital] | Voz:[Con X logras Y en solo Z días] | Pantalla:[Beneficio principal]\\nESC3 (5s): Visual:[resultado final + logo marca en zona segura] | Voz:[Empieza hoy] | Pantalla:[Escríbenos ahora →]\\nDURACIÓN: 20s | MOMENTO: Pitch\\nSHAREABILITY: dato sorprendente que la audiencia querrá reenviar a un amigo","cta":"Escríbenos hoy mismo","kpi":"Reproducciones"}]`

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
