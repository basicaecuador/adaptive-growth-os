import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPlanWithItems } from '@/services/content-plans.service'
import { getBrandWithSetup } from '@/services/brands.service'
import { getAnthropicClient } from '@/lib/ai/client'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export const maxDuration = 60

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
      const isGoogle = /google/i.test(idea.contentType ?? '')
      return `${i + 1}. Producto:"${item.rawIdeas!.product ?? brand.name}" | Etapa:${item.funnelStage} | Formato:${idea.contentType} | Canal:${item.rawIdeas!.channel}
   Concepto: ${idea.name}
   Hook: ${idea.hook}
   Emoción objetivo: ${item.rawIdeas!.targetEmotion}
   CTA: ${idea.cta}
   ${isVideo ? `Guion resumen: ${idea.development.slice(0, 200)}` : ''}
   ${isGoogle ? `Anuncio base: ${idea.development.slice(0, 200)}` : ''}`
    }).join('\n\n')

    const prompt = `Eres copywriter senior especializado en redes sociales para Ecuador y Latinoamérica.

MARCA: ${brand.name}
Voz: ${brand.voice || 'N/A'} | Tono: ${brand.tone || 'N/A'}
Audiencia: ${brand.targetAudience || 'N/A'}
Propuesta de valor: ${brand.valueProposition || 'N/A'}
MES: ${monthName} ${plan.year}

Para cada pieza genera el copy de producción listo para publicar:

PIEZAS:
${piecesText}

INSTRUCCIÓN POR TIPO:

Reel / Historia / Video → Genera:
- caption: texto completo del post (2-3 párrafos, tono humano de la plataforma, emojis naturales sin exagerar, NO menciones "link en bio" ni clichés como "¡Síguenos!"). 280-420 caracteres sin hashtags.
- hook_text: texto exacto para pantalla en los primeros 3 segundos (máximo 7 palabras, impactante).
- hashtags: 10-14 hashtags mix (nicho Ecuador + categoría + general). Sin el #, como array.

Post estático / Carrusel → Genera:
- caption: texto completo (3-4 párrafos, conversacional, emojis naturales). 320-480 caracteres sin hashtags.
- hook_text: "" (vacío)
- hashtags: 10-14 hashtags. Sin el #, como array.

Google Search Ad / Google Display → Genera:
- caption: copy final de los 3 títulos y 2 descripciones (formato: "T1: [...] | T2: [...] | T3: [...] | D1: [...] | D2: [...]").
- hook_text: "" (vacío)
- hashtags: [] (vacío)

REGLAS:
- Voz en primera persona plural (nosotros) o segunda persona (tú/tu), según la marca
- Sin hashtags dentro del caption, van solo al final como array
- Cada caption debe terminar con el CTA de forma natural, no forzada
- Adapta el español al mercado ecuatoriano/latinoamericano

Devuelve SOLO JSON array sin markdown, una entrada por pieza en el mismo orden:
[{"index":0,"caption":"...","hook_text":"...","hashtags":["marketing","ecuador"]}]`

    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: 'JSON generator. Respond ONLY with a valid JSON array. No markdown, no code blocks. Start with [ end with ].',
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
