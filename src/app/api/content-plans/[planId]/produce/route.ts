import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPlanWithItems } from '@/services/content-plans.service'
import { getBrandWithSetup } from '@/services/brands.service'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await params
    const db = createAdminClient()
    const { plan, items } = await getPlanWithItems(db, planId)
    const brand = await getBrandWithSetup(db, plan.brandId)

    const approved = items.filter(i => i.status === 'approved' && i.rawIdeas)
    if (approved.length === 0) {
      return NextResponse.json({ error: 'No hay piezas aprobadas' }, { status: 400 })
    }

    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const monthName = monthNames[plan.month - 1]

    const piecesText = approved.map((item, i) => {
      const idea = item.rawIdeas!.ideas[0]
      const isVideo = /reel|historia|video|story/i.test(idea.contentType ?? '')
      const isCarousel = /carrusel|carousel/i.test(idea.contentType ?? '')
      const isGoogle = /google/i.test(idea.contentType ?? '')
      const isStatic = !isVideo && !isCarousel && !isGoogle

      const guionBlock = isVideo
        ? `\n   GUION APROBADO (úsalo como fuente narrativa para el caption y hook en pantalla):\n${idea.development}`
        : isCarousel
        ? `\n   ESTRUCTURA DE SLIDES APROBADA (el caption debe seguir la narrativa de estos slides):\n${idea.development}`
        : isGoogle
        ? `\n   ANUNCIO BASE APROBADO:\n${idea.development}`
        : isStatic
        ? `\n   COPY BASE APROBADO:\n${idea.development}`
        : ''

      return `${i + 1}. Producto: "${item.rawIdeas!.product ?? brand.name}" | Etapa: ${item.funnelStage} | Formato: ${idea.contentType} | Canal: ${item.rawIdeas!.channel}
   Concepto: ${idea.name}
   Hook: ${idea.hook}
   Emoción objetivo: ${item.rawIdeas!.targetEmotion}
   CTA aprobado: ${idea.cta}
   KPI: ${idea.kpi}${guionBlock}`
    }).join('\n\n---\n\n')

    const prompt = `Eres copywriter senior especializado en redes sociales para Ecuador y Latinoamérica.

MARCA: ${brand.name}
Voz: ${brand.voice || 'N/A'} | Tono: ${brand.tone || 'N/A'}
Audiencia: ${brand.targetAudience || 'N/A'}
Propuesta de valor: ${brand.valueProposition || 'N/A'}
MES: ${monthName} ${plan.year}

REGLA MAESTRA: Cada pieza tiene un guion/estructura aprobada por el cliente. El caption, hook_text y hashtags deben ser COHERENTES con ese guion. El guion es la fuente de verdad narrativa — no lo ignores, no lo contradigan, no inventes un concepto diferente.

PIEZAS APROBADAS:
${piecesText}

INSTRUCCIÓN POR TIPO:

Reel / Historia / Video →
- caption: 2-3 párrafos en tono humano de la plataforma. Debe reflejar la narrativa del guion aprobado (no es un resumen, es la versión caption que acompaña al video). Emojis naturales sin exagerar. Sin "link en bio" ni "¡Síguenos!". 280-420 caracteres sin hashtags.
- hook_text: texto EXACTO para pantalla en los primeros 3 segundos. Máximo 7 palabras. Debe coincidir con el hook visual del guion (campo ESC1 Pantalla si existe). Impactante, sin puntuación innecesaria.
- hashtags: 10-14 hashtags mix (nicho Ecuador + categoría + general). Sin #, como array.

Post estático / Carrusel →
- caption: 3-4 párrafos conversacionales que reflejen la propuesta del copy base aprobado. Emojis naturales. 320-480 caracteres sin hashtags.
- hook_text: "" (vacío)
- hashtags: 10-14 hashtags. Sin #, como array.

Google Search Ad / Google Display →
- caption: Usa el anuncio base aprobado como referencia. Devuelve el copy final: "T1: [...] | T2: [...] | T3: [...] | D1: [...] | D2: [...]". Respeta los límites de caracteres (títulos ≤30c, descripciones ≤90c).
- hook_text: "" (vacío)
- hashtags: [] (vacío)

REGLAS ADICIONALES:
- Voz en primera persona plural (nosotros) o segunda persona (tú/tu), según la marca
- Sin hashtags dentro del caption — van solo como array
- El CTA aprobado debe aparecer de forma natural al final del caption
- Español ecuatoriano/latinoamericano, no castellano peninsular

Devuelve SOLO JSON array sin markdown, una entrada por pieza en el mismo orden:
[{"index":0,"caption":"...","hook_text":"...","hashtags":["marketing","ecuador"]}]`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 12000,
      system: 'Eres un generador de JSON para producción de copys. Responde ÚNICAMENTE con un array JSON válido. Sin markdown, sin bloques de código. Empieza con [ y termina con ].',
      messages: [{ role: 'user', content: prompt }],
    })

    if (message.stop_reason === 'max_tokens') {
      throw new Error('La respuesta fue demasiado larga. Intenta con menos piezas aprobadas o regenera el plan.')
    }

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = stripped.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error(`Respuesta inválida del modelo: ${stripped.slice(0, 200)}`)

    const generated = JSON.parse(jsonMatch[0].replace(/,\s*([\]}])/g, '$1')) as {
      index: number
      caption: string
      hook_text: string
      hashtags: string[]
    }[]

    // Store production copy in observations field per item
    const updates = await Promise.all(
      generated.map(async ({ index, caption, hook_text, hashtags }) => {
        const item = approved[index]
        if (!item) return null
        const hashtagLine = hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : ''
        const hookLine = hook_text ? `\n\n📱 HOOK EN PANTALLA: ${hook_text}` : ''
        const productionCopy = `${caption}${hookLine}${hashtagLine}`
        await db.from('content_plan_items')
          .update({ observations: productionCopy })
          .eq('id', item.id)
        return { id: item.id, observations: productionCopy }
      })
    )

    return NextResponse.json({ data: updates.filter(Boolean) })
  } catch (err) {
    return errorResponse(err)
  }
}
