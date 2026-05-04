'use client'

import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check, X, Pencil, ChevronRight, ChevronLeft, Zap, Heart, BarChart2, RefreshCw, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SafeZonePreview } from '@/components/creative/safe-zone-preview'
import { AdobeExpressBtn } from '@/components/creative/adobe-express-btn'
import {
  useContentPlan,
  useGenerateBrief,
  useGeneratePlan,
  useUpdatePlan,
  useUpdatePlanItem,
  useRefineIdea,
  useProducePlan,
  useGenerateImage,
} from '@/hooks/use-content-plans'
import { toast } from 'sonner'
import type { ContentPlanItem, FunnelStage, PlanIdea, IdeaType } from '@/types/domain'

interface Props {
  params: Promise<{ brandId: string; planId: string }>
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FUNNEL_COLORS: Record<FunnelStage, string> = {
  awareness: 'bg-purple-100 text-purple-700 border-purple-200',
  consideration: 'bg-blue-100 text-blue-700 border-blue-200',
  conversion: 'bg-green-100 text-green-700 border-green-200',
  retention: 'bg-orange-100 text-orange-700 border-orange-200',
  remarketing: 'bg-pink-100 text-pink-700 border-pink-200',
}

const FUNNEL_LABELS: Record<FunnelStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideración',
  conversion: 'Conversión',
  retention: 'Retención',
  remarketing: 'Remarketing',
}

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const IDEA_CONFIG: Record<IdeaType, { label: string; icon: React.ReactNode; color: string; border: string; bg: string; badge: string }> = {
  disruptiva: {
    label: 'Disruptiva',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-rose-600',
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    badge: 'bg-rose-100 text-rose-700',
  },
  aspiracional: {
    label: 'Aspiracional',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-violet-600',
    border: 'border-violet-200',
    bg: 'bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
  },
  racional: {
    label: 'Racional',
    icon: <BarChart2 className="h-4 w-4" />,
    color: 'text-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
}

const COLUMNS: { key: keyof ContentPlanItem; label: string; width: string }[] = [
  { key: 'temporality', label: 'Fecha / Temporalidad', width: 'w-36' },
  { key: 'funnelStage', label: 'Etapa funnel', width: 'w-32' },
  { key: 'objective', label: 'Objetivo', width: 'w-40' },
  { key: 'idea', label: 'Idea de contenido', width: 'w-48' },
  { key: 'format', label: 'Formato', width: 'w-24' },
  { key: 'channel', label: 'Canal', width: 'w-24' },
  { key: 'kpi', label: 'KPI', width: 'w-36' },
  { key: 'mainMessage', label: 'Mensaje principal', width: 'w-48' },
  { key: 'cta', label: 'CTA', width: 'w-32' },
  { key: 'observations', label: 'Observaciones', width: 'w-48' },
]

const CHANNELS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Google', 'Email', 'WhatsApp']

const CHANNEL_INFO: Record<string, { description: string }> = {
  Instagram: { description: 'Mayor alcance orgánico · Reels + Stories de alto impacto' },
  Facebook: { description: 'Comunidad establecida · Grupos y alcance eficiente' },
  TikTok: { description: 'Crecimiento acelerado · Audiencia 18-35 años' },
  LinkedIn: { description: 'Autoridad profesional · Audiencias B2B' },
  Google: { description: 'Intención activa de compra · Search Ads + Display' },
  Email: { description: 'Alta conversión · Sin algoritmo, audiencia propia' },
  WhatsApp: { description: 'Cierre de ventas directo · Status y difusión' },
}


const FUNNEL_FOCUS_OPTIONS = [
  { value: 'balanced', label: 'Equilibrado', description: 'Distribución balanceada entre todas las etapas' },
  { value: 'awareness', label: 'Priorizar awareness', description: 'Más alcance y captación de audiencia nueva' },
  { value: 'conversion', label: 'Priorizar conversión', description: 'Enfoque en ventas y generación de leads' },
  { value: 'retention', label: 'Priorizar retención', description: 'Fidelización de clientes actuales' },
]

const VIDEO_FORMATS = ['Reel', 'Historia', 'Video', 'Story']

const VISUAL_STYLES = [
  { id: 'fotorealista' as const, label: 'Fotorealista', desc: 'Foto comercial', modifier: 'ultra-realistic commercial photography, natural daylight, sharp focus, Canon DSLR quality' },
  { id: 'cinematico' as const, label: 'Cine', desc: 'Luz dramática', modifier: 'cinematic film photography, dramatic moody lighting, shallow depth of field, movie still' },
  { id: 'ilustracion' as const, label: 'Ilustración', desc: 'Digital art', modifier: 'professional digital illustration, bold vibrant colors, editorial graphic style' },
  { id: '3d' as const, label: '3D', desc: 'CGI render', modifier: 'photorealistic 3D CGI render, studio product lighting, clean background, octane quality' },
  { id: 'minimalista' as const, label: 'Minimal', desc: 'Clean & simple', modifier: 'minimalist photography, clean light background, product focus, lots of white space' },
]
type VisualStyleId = typeof VISUAL_STYLES[number]['id']

function parseSlides(development: string): { label: string; visual: string; text: string }[] {
  const results: { label: string; visual: string; text: string }[] = []
  for (const line of development.split('\n')) {
    const m = line.match(/^(S\d+)[^:]*:\s*(.+?)\s*\|\s*Visual:\s*(.+)$/i)
    if (m) results.push({ label: m[1].toUpperCase(), text: m[2].trim(), visual: m[3].trim() })
  }
  return results
}

function parseScenes(development: string): { label: string; visual: string; voice: string }[] {
  const results: { label: string; visual: string; voice: string }[] = []
  for (const line of development.split('\n')) {
    const m = line.match(/^(ESC\d+)[^:]*:\s*Visual:\s*([^|]+?)(?:\s*\|\s*Voz:\s*(.+))?$/i)
    if (m) results.push({ label: m[1].toUpperCase(), visual: m[2].trim(), voice: (m[3] ?? '').trim() })
  }
  return results
}

function buildDallePrompt(idea: PlanIdea, styleId: VisualStyleId, segmentIdx: number): string {
  const style = VISUAL_STYLES.find(s => s.id === styleId)!
  const format = idea.contentType ?? 'Post'
  const isCarousel = /carrusel|carousel/i.test(format)
  const isVertical = /historia|story/i.test(format)

  const parts: string[] = [style.modifier]

  if (isCarousel) {
    const slides = parseSlides(idea.development ?? '')
    const slide = slides[segmentIdx]
    if (slide) {
      // Use the actual slide text that was already generated
      parts.push(`${slide.label}: "${slide.text}"`)
      if (slide.visual) parts.push(`Visual: ${slide.visual}`)
      const isFirst = segmentIdx === 0
      const isLast = segmentIdx === slides.length - 1
      parts.push(isFirst
        ? 'Hook slide — parar el scroll en los primeros 3 segundos, impacto visual fuerte'
        : isLast
        ? 'Slide CTA — llamada a la acción clara, marca visible'
        : 'Slide de información — composición limpia y legible')
    } else {
      // Fallback to hook if slides can't be parsed
      parts.push(`Hook: "${idea.hook}"`)
    }
  } else {
    // Post or any other static format — use the full generated content
    parts.push(`Hook: "${idea.hook}"`)
    const visualMatch = (idea.development ?? '').match(/VISUAL:\s*([^\n]+)/i)
    if (visualMatch?.[1]) parts.push(`Visual: ${visualMatch[1].trim()}`)
    if (idea.cta) parts.push(`CTA: "${idea.cta}"`)
  }

  parts.push(
    isVertical
      ? 'Formato vertical 9:16, sujeto centrado alejado del 15% superior e inferior (safe zone)'
      : 'Formato cuadrado 1:1, sujeto centrado en el encuadre',
    'Sin texto superpuesto, sin marcas de agua, alta resolución, composición thumb-stop, contenido listo para redes sociales'
  )

  return parts.join('. ')
}

function CreativeTools({
  idea,
  planId,
  itemId,
  compact = false,
}: {
  idea: PlanIdea
  planId: string
  itemId: string
  compact?: boolean
}) {
  const isVideo = VIDEO_FORMATS.some(f => idea.contentType?.toLowerCase().includes(f.toLowerCase()))
  const isCarousel = /carrusel|carousel/i.test(idea.contentType ?? '')
  const isGoogle = /google/i.test(idea.contentType ?? '')
  const isStatic = !isVideo && !isGoogle

  const [copied, setCopied] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [visualStyle, setVisualStyle] = useState<VisualStyleId>('fotorealista')
  const [segmentIdx, setSegmentIdx] = useState(0)
  const [promptText, setPromptText] = useState('')
  const [promptReady, setPromptReady] = useState(false)

  const { mutateAsync: generateImage, isPending: generatingImage } = useGenerateImage(planId)

  const slides = isCarousel ? parseSlides(idea.development ?? '') : []
  const scenes = isVideo ? parseScenes(idea.development ?? '') : []

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handlePreparePrompt() {
    const prompt = buildDallePrompt(idea, visualStyle, segmentIdx)
    setPromptText(prompt)
    setPromptReady(true)
  }

  async function handleGenerateImage() {
    try {
      const result = await generateImage({ itemId, prompt: promptText })
      setImageUrl(result.imageUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar imagen')
    }
  }

  return (
    <div className={`rounded-xl border border-border bg-muted/30 p-4 space-y-4 ${compact ? 'text-xs' : ''}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Herramientas de producción
      </p>
      <div className="flex items-start gap-4">
        {!isGoogle && <SafeZonePreview format={idea.contentType ?? ''} />}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Video: Higgsfield prompt */}
          {isVideo && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Prompt para Higgsfield IA
              </p>
              {scenes.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-2">
                  {scenes.map((sc) => (
                    <span key={sc.label} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {sc.label}
                    </span>
                  ))}
                </div>
              )}
              {idea.higgsfieldPrompt && (
                <p className="text-xs text-foreground/80 italic leading-relaxed bg-black/[0.04] rounded-lg px-3 py-2">
                  {idea.higgsfieldPrompt}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {idea.higgsfieldPrompt && (
                  <button
                    onClick={() => copyText(idea.higgsfieldPrompt!)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? 'Copiado' : 'Copiar prompt'}
                  </button>
                )}
                <a
                  href="https://higgsfield.ai/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Abrir Higgsfield
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Static image generation with prompt preview */}
          {isStatic && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Generar imagen con IA
              </p>

              {/* Style selector */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Estilo visual</p>
                <div className="flex gap-1.5 flex-wrap">
                  {VISUAL_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => { setVisualStyle(style.id); setPromptReady(false) }}
                      className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                        visualStyle === style.id
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                      }`}
                    >
                      <span className="block text-xs font-medium">{style.label}</span>
                      <span className={`block text-[9px] mt-0.5 ${visualStyle === style.id ? 'opacity-70' : 'opacity-50'}`}>
                        {style.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slide selector for carousel */}
              {isCarousel && slides.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Slide a generar</p>
                  <div className="flex gap-1 flex-wrap">
                    {slides.map((slide, i) => (
                      <button
                        key={slide.label}
                        onClick={() => { setSegmentIdx(i); setPromptReady(false) }}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                          segmentIdx === i
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-muted-foreground hover:border-foreground/40'
                        }`}
                      >
                        {slide.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prepare prompt or editable prompt */}
              {!promptReady ? (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handlePreparePrompt}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Preparar prompt
                  </Button>
                  <AdobeExpressBtn format={idea.contentType ?? 'Post'} />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground">Prompt para DALL-E 3 — edítalo antes de generar</p>
                  <textarea
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
                  />
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button
                      onClick={handleGenerateImage}
                      disabled={generatingImage || !promptText.trim()}
                      size="sm"
                      className="gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {generatingImage ? 'Generando...' : imageUrl ? 'Regenerar' : 'Generar con DALL-E 3'}
                    </Button>
                    <button
                      onClick={() => { setPromptReady(false); setImageUrl(null) }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Cambiar estilo
                    </button>
                    <button
                      onClick={() => copyText(promptText)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? 'Copiado' : 'Copiar prompt'}
                    </button>
                  </div>
                  {generatingImage && (
                    <p className="text-[11px] text-muted-foreground animate-pulse">
                      DALL-E 3 está creando la imagen en alta resolución...
                    </p>
                  )}
                </div>
              )}

              {imageUrl && (
                <div className="space-y-2 pt-1">
                  <img
                    src={imageUrl}
                    alt="Imagen generada"
                    className="rounded-xl border border-border w-full max-w-sm object-cover shadow-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abrir en tamaño completo
                    </a>
                    <AdobeExpressBtn format={idea.contentType ?? 'Post'} />
                  </div>
                </div>
              )}
            </div>
          )}

          {isGoogle && (
            <p className="text-xs text-muted-foreground">
              Copia el texto del anuncio y créalo en Google Ads Manager.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function EditableCell({
  value,
  onSave,
  multiline = false,
}: {
  value: string | null
  onSave: (v: string) => void
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  function start() {
    setDraft(value ?? '')
    setEditing(true)
    setTimeout(() => ref.current?.focus(), 0)
  }

  function save() {
    setEditing(false)
    if (draft !== (value ?? '')) onSave(draft)
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          className="w-full min-h-[80px] resize-none rounded border border-ring bg-background px-2 py-1 text-xs focus:outline-none"
        />
      )
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save() }}
        className="w-full rounded border border-ring bg-background px-2 py-1 text-xs focus:outline-none"
      />
    )
  }

  return (
    <div
      onClick={start}
      className="group relative cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 min-h-[24px]"
    >
      <span className="text-xs text-foreground whitespace-pre-wrap">{value ?? ''}</span>
      <Pencil className="absolute right-1 top-1 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function IdeaDetail({ idea, isRefined }: { idea: PlanIdea; isRefined?: boolean }) {
  const cfg = IDEA_CONFIG[idea.type] ?? IDEA_CONFIG['disruptiva']
  const isVideo = VIDEO_FORMATS.some(f => idea.contentType?.toLowerCase().includes(f.toLowerCase()))
  const isCarousel = /carrusel|carousel/i.test(idea.contentType ?? '')
  const isGoogle = /google/i.test(idea.contentType ?? '')

  const contentLabel = isVideo
    ? 'Guion por escenas'
    : isCarousel
    ? 'Estructura de slides'
    : isGoogle
    ? 'Anuncio'
    : 'Copy completo'

  const hookLabel = isVideo ? 'Hook — primeros 3 segundos' : 'Apertura'

  const contentLines = (idea.development ?? '').split('\n').filter(l => l.trim())

  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5 space-y-4`}>
      {isRefined && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <RefreshCw className="h-3 w-3" />
          Versión refinada
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {idea.contentType && (
          <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {idea.contentType}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}>
          {cfg.icon}
          {cfg.label}
        </span>
        {isVideo && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Video</span>
        )}
        {isGoogle && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Google Ads</span>
        )}
      </div>

      {/* Hook */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{hookLabel}</p>
        <p className="text-sm font-medium text-foreground">{idea.hook}</p>
        {isVideo && idea.higgsfieldPrompt && (
          <div className="mt-2 rounded-lg bg-black/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Higgsfield — dirección visual</p>
            <p className="text-xs text-foreground/80 italic">{idea.higgsfieldPrompt}</p>
          </div>
        )}
      </div>

      {/* Rich production content */}
      {contentLines.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{contentLabel}</p>
          <div className="space-y-1.5">
            {contentLines.map((line, i) => {
              const isDurationOrTotal = /^(DURACIÓN|TOTAL|URL):/i.test(line)
              return (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 ${isDurationOrTotal ? 'bg-muted/60' : 'bg-black/[0.04]'}`}
                >
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono">{line}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA + KPI */}
      <div className="flex gap-4 pt-1">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">CTA</p>
          <p className="text-sm font-medium text-foreground">{idea.cta}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">KPI</p>
          <p className="text-sm text-foreground">{idea.kpi || '—'}</p>
        </div>
      </div>
    </div>
  )
}

export default function PlanDetailPage({ params }: Props) {
  const { brandId, planId } = use(params)
  const { data, isLoading } = useContentPlan(planId)
  const { mutateAsync: generateBrief, isPending: generatingBrief } = useGenerateBrief(planId)
  const { mutateAsync: generate, isPending: generating } = useGeneratePlan(planId)
  const { mutateAsync: updatePlan, isPending: savingBrief } = useUpdatePlan(planId)
  const { mutateAsync: updateItem } = useUpdatePlanItem(planId)
  const { mutateAsync: refineIdea, isPending: refining } = useRefineIdea(planId)
  const { mutateAsync: producePlan, isPending: producing } = useProducePlan(planId)

  const plan = data?.plan
  const items = data?.items ?? []

  // Step 1 state
  const [channelMix, setChannelMix] = useState<string[]>(['Instagram', 'Facebook'])
  const [funnelFocus, setFunnelFocus] = useState('balanced')

  // Step 2 brief editing
  const [editingBrief, setEditingBrief] = useState(false)
  const [briefDraft, setBriefDraft] = useState('')
  const [showBrief, setShowBrief] = useState(false)

  // Step 3 wizard state
  const [reviewItemId, setReviewItemId] = useState<string | null>(null)
  const [refineMode, setRefineMode] = useState(false)
  const [refineFeedback, setRefineFeedback] = useState('')
  const [refinedIdea, setRefinedIdea] = useState<PlanIdea | null>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)

  // Sync channel mix and funnel focus from stored plan data on load
  useEffect(() => {
    if (plan?.channelMix?.length) setChannelMix(plan.channelMix)
    if (plan?.funnelFocus) setFunnelFocus(plan.funnelFocus)
  }, [plan?.id])

  function toggleChannel(ch: string) {
    setChannelMix(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )
  }

  async function handleGenerateBrief() {
    if (channelMix.length === 0) {
      toast.error('Selecciona al menos un canal')
      return
    }
    const computedPieces = (plan?.products?.length ?? 1) * 7
    try {
      await generateBrief({ channelMix, funnelFocus, piecesCount: computedPieces })
      toast.success('Brief estratégico generado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar brief')
    }
  }

  async function handleSaveBrief() {
    try {
      await updatePlan({ strategicBrief: briefDraft })
      setEditingBrief(false)
      toast.success('Brief actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  async function handleResetBrief() {
    try {
      await updatePlan({ strategicBrief: null })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  async function handleGenerate() {
    setReviewItemId(null)
    setRefinedIdea(null)
    setRefineMode(false)
    setConfirmRegen(false)
    try {
      await generate()
      toast.success('Ideas generadas — revisa y aprueba cada pieza')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar')
    }
  }

  async function handleRefine() {
    if (!reviewItemId || !refineFeedback.trim()) return
    const item = items.find(i => i.id === reviewItemId)
    if (!item?.rawIdeas) return
    const baseIdea = refinedIdea ?? item.rawIdeas.ideas[0]
    if (!baseIdea) return

    const currentSet = {
      ...item.rawIdeas,
      ideas: refinedIdea
        ? item.rawIdeas.ideas.map(i => i.type === refinedIdea.type ? refinedIdea : i)
        : item.rawIdeas.ideas,
    }

    try {
      const refined = await refineIdea({
        itemId: reviewItemId,
        ideaType: baseIdea.type,
        feedback: refineFeedback.trim(),
        currentIdeaSet: currentSet,
      })
      setRefinedIdea(refined)
      setRefineMode(false)
      setRefineFeedback('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al refinar')
    }
  }

  async function handleApproveIdea() {
    if (!reviewItemId) return
    const item = items.find(i => i.id === reviewItemId)
    if (!item?.rawIdeas) return
    const idea = refinedIdea ?? item.rawIdeas.ideas[0]
    if (!idea) return

    // Decide navigation BEFORE the async call — items state is stable here
    const currentIdx = items.indexOf(item)
    const nextPending =
      items.slice(currentIdx + 1).find(i => i.status !== 'approved' && i.rawIdeas) ??
      items.slice(0, currentIdx).find(i => i.status !== 'approved' && i.rawIdeas)

    try {
      await updateItem({
        itemId: reviewItemId,
        patch: {
          selectedIdeaType: idea.type,
          status: 'approved',
          idea: `${idea.name}: ${idea.hook}`,
          format: idea.contentType,
          channel: item.rawIdeas.channel,
          objective: idea.funnelObjective || item.rawIdeas.funnelStage,
          kpi: idea.kpi,
          mainMessage: idea.hook,
          cta: idea.cta,
          benchmarkReference: idea.benchmarkReference,
        },
      })

      if (nextPending) {
        setReviewItemId(nextPending.id)
        setRefinedIdea(null)
        setRefineMode(false)
        setRefineFeedback('')
        toast.success('Pieza aprobada — siguiente')
      } else {
        setReviewItemId(null)
        setRefinedIdea(null)
        toast.success('¡Plan de ideas completo! Genera los copys cuando estés listo.')
        try { await updatePlan({ status: 'active' }) } catch {}
      }
    } catch {
      toast.error('Error al aprobar pieza')
    }
  }

  async function handleProduce() {
    try {
      await producePlan()
      toast.success('Copys de producción generados')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar copys')
    }
  }

  async function handleUpdateField(itemId: string, field: keyof ContentPlanItem, value: string) {
    try {
      await updateItem({ itemId, patch: { [field]: value } })
    } catch {
      toast.error('Error al guardar cambio')
    }
  }

  async function handleStatus(itemId: string, status: 'approved' | 'rejected' | 'draft') {
    try {
      await updateItem({ itemId, patch: { status } })
      toast.success(status === 'approved' ? 'Aprobado' : status === 'rejected' ? 'Rechazado' : 'Restablecido')
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Cargando...</div>

  const monthLabel = plan ? `${MONTH_NAMES[plan.month - 1]} ${plan.year}` : '—'

  const Header = (
    <div className="mb-8">
      <Link
        href={`/brands/${brandId}/plans`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a planes
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{monthLabel}</h1>
      {plan?.products && (
        <div className="mt-2 flex flex-wrap gap-2">
          {plan.products.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {p.name} · <span className="text-foreground">{p.objective}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )

  // ── STEP 1: Define strategy ─────────────────────────────────────
  if (!plan?.strategicBrief) {
    const numProducts = plan?.products?.length ?? 1
    const totalPieces = numProducts * 7

    return (
      <div className="p-8 max-w-2xl">
        {Header}

        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">1</span>
          <span className="font-medium text-foreground">Estrategia</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">2</span>
          <span className="text-muted-foreground">Brief</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">3</span>
          <span className="text-muted-foreground">Plan de contenidos</span>
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
          <p className="text-sm text-violet-800">
            Generaré un funnel completo por cada producto: <strong>{totalPieces} piezas</strong> ({numProducts} producto{numProducts !== 1 ? 's' : ''} × 7 etapas). Confirma los canales y el enfoque del mes.
          </p>
        </div>

        <div className="space-y-4">
          {/* Funnel distribution info */}
          <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Distribución del funnel por producto</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Awareness', pieces: 2, color: 'bg-purple-100 text-purple-700' },
                { label: 'Consideración', pieces: 2, color: 'bg-blue-100 text-blue-700' },
                { label: 'Conversión', pieces: 2, color: 'bg-green-100 text-green-700' },
                { label: 'Remarketing', pieces: 1, color: 'bg-pink-100 text-pink-700' },
              ].map(stage => (
                <div key={stage.label} className={`rounded-lg px-2 py-2.5 ${stage.color}`}>
                  <p className="text-lg font-bold">{stage.pieces}</p>
                  <p className="text-[10px] font-medium leading-tight mt-0.5">{stage.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Cada pieza incluye guion, slides o copy completo listo para producción
            </p>
          </div>

          {/* Channels */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-card-foreground">¿En qué canales publicarán?</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Activa los canales que usará la marca este mes</p>
            </div>
            <div className="space-y-1.5">
              {CHANNELS.map(ch => {
                const info = CHANNEL_INFO[ch]
                const active = channelMix.includes(ch)
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all ${
                      active
                        ? 'border-foreground/30 bg-foreground/5'
                        : 'border-border bg-background hover:border-foreground/25 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-none mb-0.5 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{ch}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${active ? 'border-foreground bg-foreground' : 'border-muted-foreground/40'}`}>
                      {active && <Check className="h-3 w-3 text-background" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Funnel focus */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-card-foreground">¿Cuál es la prioridad estratégica del mes?</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Define el foco para la distribución de contenidos</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FUNNEL_FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFunnelFocus(opt.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    funnelFocus === opt.value
                      ? 'border-foreground bg-foreground/5'
                      : 'border-border hover:border-foreground/50'
                  }`}
                >
                  <p className="text-sm font-medium text-card-foreground">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerateBrief}
            disabled={generatingBrief || channelMix.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            {generatingBrief ? 'Generando brief...' : 'Generar brief estratégico'}
          </Button>
        </div>
      </div>
    )
  }

  // ── STEP 2: Review brief ────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="p-8 max-w-3xl">
        {Header}

        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            <Check className="h-3.5 w-3.5" />
          </span>
          <span className="text-muted-foreground">Estrategia</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">2</span>
          <span className="font-medium text-foreground">Brief</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">3</span>
          <span className="text-muted-foreground">Ideas de contenido</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">Brief estratégico</h2>
            {!editingBrief && (
              <button
                onClick={() => { setBriefDraft(plan.strategicBrief ?? ''); setEditingBrief(true) }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            )}
          </div>

          {editingBrief ? (
            <div className="space-y-3">
              <textarea
                value={briefDraft}
                onChange={e => setBriefDraft(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveBrief} disabled={savingBrief}>
                  {savingBrief ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingBrief(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-card-foreground">
              {plan.strategicBrief?.split('\n').map((line, i) => {
                if (line.startsWith('### ')) return <h3 key={i} className="mt-4 mb-1 text-sm font-semibold text-foreground">{line.slice(4)}</h3>
                if (line.startsWith('## ')) return <h2 key={i} className="mt-5 mb-1 text-base font-bold text-foreground">{line.slice(3)}</h2>
                if (line.startsWith('- ')) return <p key={i} className="flex gap-2 text-sm text-muted-foreground my-0.5"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" /><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} /></p>
                if (/^\d+\./.test(line)) return <p key={i} className="text-sm text-muted-foreground my-0.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                if (line.trim() === '') return <div key={i} className="h-1" />
                return <p key={i} className="text-sm text-muted-foreground my-0.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleResetBrief}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            ← Volver a configurar
          </button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Creando contenido...' : 'Crear contenido'}
          </Button>
        </div>

        {generating && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
            Claude está creando guiones, slides y copy para cada pieza...
          </div>
        )}
      </div>
    )
  }

  // ── STEP 3: Idea wizard or table ────────────────────────────────
  const hasIdeas = items.some(i => i.rawIdeas != null)
  const approvedCount = items.filter(i => i.status === 'approved').length
  const allApproved = approvedCount === items.length
  const hasProductionCopy = items.some(i => i.status === 'approved' && !!i.observations)

  // Legacy table view (items generated before the 3-idea format)
  if (!hasIdeas) {
    return (
      <div className="p-8">
        <Link
          href={`/brands/${brandId}/plans`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a planes
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{monthLabel}</h1>
          </div>
          <Button onClick={handleGenerate} disabled={generating} variant="outline" className="gap-2 shrink-0">
            <Sparkles className="h-4 w-4" />
            {generating ? 'Regenerando...' : 'Regenerar plan'}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-20">Estado</th>
                {COLUMNS.map(col => (
                  <th key={col.key} className={`px-3 py-2.5 text-left text-xs font-medium text-muted-foreground ${col.width}`}>
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-border ${
                    item.status === 'approved' ? 'bg-green-50/50' :
                    item.status === 'rejected' ? 'bg-red-50/30 opacity-60' :
                    idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[item.status]}`}>
                      {item.status === 'draft' ? 'Revisión' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell value={item.temporality} onSave={v => handleUpdateField(item.id, 'temporality', v)} />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.funnelStage}
                      onChange={e => handleUpdateField(item.id, 'funnelStage', e.target.value)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium cursor-pointer focus:outline-none ${FUNNEL_COLORS[item.funnelStage]}`}
                    >
                      {(Object.keys(FUNNEL_LABELS) as FunnelStage[]).map(s => (
                        <option key={s} value={s}>{FUNNEL_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  {(['objective', 'idea'] as const).map(field => (
                    <td key={field} className="px-3 py-2 align-top">
                      <EditableCell value={item[field]} onSave={v => handleUpdateField(item.id, field, v)} multiline />
                    </td>
                  ))}
                  <td className="px-3 py-2"><EditableCell value={item.format} onSave={v => handleUpdateField(item.id, 'format', v)} /></td>
                  <td className="px-3 py-2"><EditableCell value={item.channel} onSave={v => handleUpdateField(item.id, 'channel', v)} /></td>
                  <td className="px-3 py-2 align-top"><EditableCell value={item.kpi} onSave={v => handleUpdateField(item.id, 'kpi', v)} multiline /></td>
                  <td className="px-3 py-2 align-top"><EditableCell value={item.mainMessage} onSave={v => handleUpdateField(item.id, 'mainMessage', v)} multiline /></td>
                  <td className="px-3 py-2"><EditableCell value={item.cta} onSave={v => handleUpdateField(item.id, 'cta', v)} /></td>
                  <td className="px-3 py-2 align-top"><EditableCell value={item.observations} onSave={v => handleUpdateField(item.id, 'observations', v)} multiline /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {item.status !== 'approved' && (
                        <button onClick={() => handleStatus(item.id, 'approved')} className="rounded p-1 text-green-600 hover:bg-green-100" title="Aprobar">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {item.status !== 'rejected' && (
                        <button onClick={() => handleStatus(item.id, 'rejected')} className="rounded p-1 text-red-500 hover:bg-red-100" title="Rechazar">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── STEP 3: idea review ─────────────────────────────────────────
  const reviewItem = reviewItemId ? items.find(i => i.id === reviewItemId) : null
  const currentItemIdx = reviewItem ? items.indexOf(reviewItem) : -1

  if (reviewItem?.rawIdeas) {
    const isApprovedReview = reviewItem.status === 'approved'
    const baseIdea = reviewItem.rawIdeas.ideas[0]
    const displayIdea = refinedIdea ?? baseIdea

    return (
      <div className="p-8 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => { setReviewItemId(null); setRefinedIdea(null); setRefineMode(false) }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Resumen
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{currentItemIdx + 1} / {items.length}</span>
            <button
              onClick={() => {
                const prev = items[currentItemIdx - 1]
                if (prev) { setReviewItemId(prev.id); setRefinedIdea(null); setRefineMode(false); setRefineFeedback('') }
              }}
              disabled={currentItemIdx <= 0}
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const next = items[currentItemIdx + 1]
                if (next) { setReviewItemId(next.id); setRefinedIdea(null); setRefineMode(false); setRefineFeedback('') }
              }}
              disabled={currentItemIdx >= items.length - 1}
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-bold text-foreground">{reviewItem.temporality}</h2>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${FUNNEL_COLORS[reviewItem.funnelStage]}`}>
              {FUNNEL_LABELS[reviewItem.funnelStage]}
            </span>
            {reviewItem.rawIdeas.product && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {reviewItem.rawIdeas.product}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{reviewItem.rawIdeas.channel}</span>
          </div>
          {reviewItem.rawIdeas.targetEmotion && (
            <p className="text-xs text-muted-foreground">Emoción objetivo: {reviewItem.rawIdeas.targetEmotion}</p>
          )}
        </div>

        {displayIdea && (
          <div className="space-y-4">
            <IdeaDetail idea={displayIdea} isRefined={!!refinedIdea} />

            {isApprovedReview ? (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">Esta pieza está aprobada. Solo lectura.</p>
              </div>
            ) : refineMode ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">¿Qué ajuste necesita esta pieza?</p>
                <textarea
                  value={refineFeedback}
                  onChange={e => setRefineFeedback(e.target.value)}
                  rows={3}
                  placeholder="Ej: Cambia el tono a más directo, ajusta el guion para enfocarse en el precio, modifica el CTA..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleRefine} disabled={refining || !refineFeedback.trim()} className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {refining ? 'Ajustando...' : 'Generar versión ajustada'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRefineMode(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {refinedIdea ? (
                  <>
                    <Button onClick={handleApproveIdea} className="gap-1.5">
                      <Check className="h-4 w-4" />
                      Usar versión ajustada
                    </Button>
                    <Button variant="outline" onClick={() => setRefineMode(true)} className="gap-1.5">
                      <RefreshCw className="h-4 w-4" />
                      Ajustar más
                    </Button>
                    <Button variant="ghost" onClick={() => setRefinedIdea(null)} className="text-muted-foreground text-sm">
                      Ver original
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleApproveIdea} className="gap-1.5">
                      <Check className="h-4 w-4" />
                      Usar esta idea
                    </Button>
                    <Button variant="outline" onClick={() => setRefineMode(true)} className="gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Ajustar con feedback
                    </Button>
                  </>
                )}
              </div>
            )}

            <CreativeTools idea={displayIdea} planId={planId} itemId={reviewItemId!} />
          </div>
        )}
      </div>
    )
  }

  // ── STEP 3 overview ─────────────────────────────────────────────
  return (
    <div className="p-8 max-w-4xl">
      <Link
        href={`/brands/${brandId}/plans`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a planes
      </Link>

      <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className="text-muted-foreground">Estrategia</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className="text-muted-foreground">Brief</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${allApproved ? 'bg-muted text-muted-foreground' : 'bg-foreground text-background'}`}>
          {allApproved ? <Check className="h-3.5 w-3.5" /> : '3'}
        </span>
        <span className={allApproved ? 'text-muted-foreground' : 'font-medium text-foreground'}>Ideas</span>
        {allApproved && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasProductionCopy ? 'bg-muted text-muted-foreground' : 'bg-foreground text-background'}`}>
              {hasProductionCopy ? <Check className="h-3.5 w-3.5" /> : '4'}
            </span>
            <span className={hasProductionCopy ? 'text-muted-foreground' : 'font-medium text-foreground'}>Copys</span>
          </>
        )}
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{monthLabel}</h1>
          {plan?.products && (
            <div className="mt-2 flex flex-wrap gap-2">
              {plan.products.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {p.name} · <span className="text-foreground">{p.objective}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {confirmRegen ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Se borrará el contenido actual</span>
            <Button onClick={handleGenerate} disabled={generating} variant="destructive" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Confirmar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmRegen(false)}>Cancelar</Button>
          </div>
        ) : (
          <Button onClick={() => setConfirmRegen(true)} disabled={generating} variant="outline" size="sm" className="gap-2 shrink-0">
            <Sparkles className="h-4 w-4" />
            {generating ? 'Reconstruyendo...' : 'Reconstruir plan'}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">
            {allApproved ? 'Todas las ideas aprobadas' : `${approvedCount} de ${items.length} ideas aprobadas`}
          </p>
          <span className="text-sm text-muted-foreground">{Math.round((approvedCount / items.length) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${(approvedCount / items.length) * 100}%` }}
          />
        </div>
        {!allApproved && (
          <p className="mt-2 text-xs text-muted-foreground">
            Haz clic en cualquier pieza pendiente para revisar y aprobar el contenido
          </p>
        )}
      </div>

      {/* Phase 4: production copy */}
      {allApproved && (
        <div className={`mb-6 rounded-xl border-2 p-5 ${hasProductionCopy ? 'border-green-200 bg-green-50/60' : 'border-violet-200 bg-violet-50/60'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Check className={`h-4 w-4 ${hasProductionCopy ? 'text-green-600' : 'text-violet-600'}`} />
                <h2 className={`text-sm font-bold ${hasProductionCopy ? 'text-green-800' : 'text-violet-800'}`}>
                  {hasProductionCopy ? '¡Copys de producción listos!' : 'Paso 4: Generar copys de producción'}
                </h2>
              </div>
              <p className={`text-xs ${hasProductionCopy ? 'text-green-700' : 'text-violet-700'}`}>
                {hasProductionCopy
                  ? 'Los captions, hooks y hashtags están listos para copiar y publicar.'
                  : 'Claude genera el caption final, hook en pantalla y hashtags para cada pieza aprobada.'}
              </p>
            </div>
            <Button
              onClick={handleProduce}
              disabled={producing}
              size="sm"
              className={`shrink-0 gap-1.5 ${hasProductionCopy ? 'bg-green-700 hover:bg-green-800' : 'bg-violet-700 hover:bg-violet-800'} text-white`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {producing ? 'Generando...' : hasProductionCopy ? 'Regenerar copys' : 'Generar copys'}
            </Button>
          </div>
          {producing && (
            <p className="mt-3 text-xs text-violet-600 animate-pulse">
              Claude está escribiendo captions y hashtags para cada pieza...
            </p>
          )}
        </div>
      )}

      {/* Collapsible brief */}
      {plan?.strategicBrief && (
        <div className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowBrief(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
          >
            <span className="font-medium text-card-foreground">Brief estratégico del mes</span>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showBrief ? 'rotate-90' : ''}`} />
          </button>
          {showBrief && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              <div className="prose prose-sm max-w-none text-card-foreground">
                {plan.strategicBrief.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) return <h3 key={i} className="mt-3 mb-1 text-sm font-semibold text-foreground">{line.slice(4)}</h3>
                  if (line.startsWith('## ')) return <h2 key={i} className="mt-4 mb-1 text-sm font-bold text-foreground">{line.slice(3)}</h2>
                  if (line.startsWith('- ')) return <p key={i} className="flex gap-2 text-xs text-muted-foreground my-0.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" /><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} /></p>
                  if (line.trim() === '') return <div key={i} className="h-1" />
                  return <p key={i} className="text-xs text-muted-foreground my-0.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {generating && (
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
          Claude está regenerando las ideas de contenido...
        </div>
      )}

      {/* Items grouped by product */}
      {(() => {
        const grouped: Record<string, typeof items> = {}
        items.forEach(item => {
          const key = item.rawIdeas?.product ?? 'General'
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(item)
        })
        return Object.entries(grouped).map(([product, productItems]) => (
          <div key={product} className="space-y-2">
            {Object.keys(grouped).length > 1 && (
              <div className="flex items-center gap-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product}</p>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {productItems.map((item, idx) => {
              const isApproved = item.status === 'approved'
              const ideaCfg = item.selectedIdeaType ? IDEA_CONFIG[item.selectedIdeaType] : null
              const globalIdx = items.indexOf(item)
              return (
                <div
                  key={item.id}
                  onClick={() => item.rawIdeas && setReviewItemId(item.id)}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    isApproved
                      ? 'border-green-200 bg-green-50/50 cursor-pointer hover:border-green-300 hover:shadow-sm'
                      : item.rawIdeas
                      ? 'border-border bg-card cursor-pointer hover:border-foreground/40 hover:shadow-sm'
                      : 'border-border bg-card cursor-default'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {globalIdx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.rawIdeas?.ideas[0]?.name ?? item.temporality ?? `Pieza ${idx + 1}`}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {item.rawIdeas?.ideas[0]?.contentType && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {item.rawIdeas.ideas[0].contentType}
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FUNNEL_COLORS[item.funnelStage]}`}>
                        {FUNNEL_LABELS[item.funnelStage]}
                      </span>
                      {item.rawIdeas?.channel && (
                        <span className="text-[11px] text-muted-foreground">{item.rawIdeas.channel}</span>
                      )}
                    </div>
                    {item.temporality && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60 truncate">{item.temporality}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {isApproved ? (
                      <div className="flex items-center gap-2">
                        {ideaCfg && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ideaCfg.badge}`}>
                            {ideaCfg.icon}
                            {ideaCfg.label}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          <Check className="h-3 w-3" />
                          Aprobada
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Revisar
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))
      })()}

      {/* Production copy document */}
      {hasProductionCopy && (
        <div className="mt-8 space-y-4">
          <h2 className="text-base font-bold text-foreground">Copys de producción</h2>
          {items.filter(i => i.status === 'approved' && i.observations).map((item, idx) => {
            const idea = item.rawIdeas?.ideas[0]
            const ideaCfg = item.selectedIdeaType ? IDEA_CONFIG[item.selectedIdeaType] : null
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{idea?.name ?? item.temporality}</p>
                    {item.format && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{item.format}</span>
                    )}
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FUNNEL_COLORS[item.funnelStage]}`}>
                      {FUNNEL_LABELS[item.funnelStage]}
                    </span>
                    {item.rawIdeas?.channel && (
                      <span className="text-xs text-muted-foreground">{item.rawIdeas.channel}</span>
                    )}
                    {ideaCfg && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ideaCfg.badge}`}>
                        {ideaCfg.icon}{ideaCfg.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(item.observations ?? '')}
                    className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                {/* Copy body */}
                <div className="p-4 space-y-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                    {item.observations}
                  </p>
                  {idea && <CreativeTools idea={idea} planId={planId} itemId={item.id} compact />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
