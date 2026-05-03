'use client'

import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check, X, Pencil, ChevronRight, ChevronLeft, Zap, Heart, BarChart2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useContentPlan,
  useGenerateBrief,
  useGeneratePlan,
  useUpdatePlan,
  useUpdatePlanItem,
  useRefineIdea,
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
}

const FUNNEL_LABELS: Record<FunnelStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideración',
  conversion: 'Conversión',
  retention: 'Retención',
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

const CHANNELS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Email', 'WhatsApp']

const CHANNEL_INFO: Record<string, { description: string }> = {
  Instagram: { description: 'Mayor alcance orgánico · Reels + Stories de alto impacto' },
  Facebook: { description: 'Comunidad establecida · Grupos y alcance eficiente' },
  TikTok: { description: 'Crecimiento acelerado · Audiencia 18-35 años' },
  LinkedIn: { description: 'Autoridad profesional · Audiencias B2B' },
  Email: { description: 'Alta conversión · Sin algoritmo, audiencia propia' },
  WhatsApp: { description: 'Cierre de ventas directo · Status y difusión' },
}

function calcPieces(n: number): number {
  if (n <= 1) return 8
  if (n === 2) return 10
  return 12
}

const FUNNEL_FOCUS_OPTIONS = [
  { value: 'balanced', label: 'Equilibrado', description: 'Distribución balanceada entre todas las etapas' },
  { value: 'awareness', label: 'Priorizar awareness', description: 'Más alcance y captación de audiencia nueva' },
  { value: 'conversion', label: 'Priorizar conversión', description: 'Enfoque en ventas y generación de leads' },
  { value: 'retention', label: 'Priorizar retención', description: 'Fidelización de clientes actuales' },
]

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

const VIDEO_FORMATS = ['Reel', 'Historia', 'Video', 'Story']

function IdeaDetail({ idea, isRefined }: { idea: PlanIdea; isRefined?: boolean }) {
  const cfg = IDEA_CONFIG[idea.type]
  const isVideo = VIDEO_FORMATS.some(f => idea.contentType?.toLowerCase().includes(f.toLowerCase()))
  const hookLabel = isVideo ? 'STOP — Hook (primeros 3 segundos)' : 'STOP — Apertura'

  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5 space-y-4`}>
      {isRefined && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <RefreshCw className="h-3 w-3" />
          Versión refinada
        </div>
      )}

      {idea.contentType && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {idea.contentType}
          </span>
          {isVideo && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Video
            </span>
          )}
        </div>
      )}

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

      {idea.development && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            THINK — {idea.contentType === 'Carrusel' ? 'Estructura de slides' : idea.contentType === 'Post' ? 'Concepto del caption' : 'Estructura narrativa'}
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{idea.development}</p>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">ACT — CTA</p>
          <p className="text-sm font-medium text-foreground">{idea.cta}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">KPI</p>
          <p className="text-sm text-foreground">{idea.kpi || '—'}</p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-[11px] text-muted-foreground">
        Al aprobar esta idea, sus campos se usarán como insumo para generar el contenido final en la siguiente fase.
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

  const plan = data?.plan
  const items = data?.items ?? []

  // Step 1 state
  const [channelMix, setChannelMix] = useState<string[]>(['Instagram', 'Facebook'])
  const [funnelFocus, setFunnelFocus] = useState('balanced')
  const [piecesCount, setPiecesCount] = useState(12)

  // Step 2 brief editing
  const [editingBrief, setEditingBrief] = useState(false)
  const [briefDraft, setBriefDraft] = useState('')

  // Step 3 wizard state
  const [reviewItemId, setReviewItemId] = useState<string | null>(null)
  const [selectedIdeaType, setSelectedIdeaType] = useState<IdeaType | null>(null)
  const [refineMode, setRefineMode] = useState(false)
  const [refineFeedback, setRefineFeedback] = useState('')
  const [refinedIdea, setRefinedIdea] = useState<PlanIdea | null>(null)

  function toggleChannel(ch: string) {
    setChannelMix(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )
  }

  useEffect(() => {
    setPiecesCount(calcPieces(channelMix.length))
  }, [channelMix])

  async function handleGenerateBrief() {
    if (channelMix.length === 0) {
      toast.error('Selecciona al menos un canal')
      return
    }
    try {
      await generateBrief({ channelMix, funnelFocus, piecesCount })
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
    setSelectedIdeaType(null)
    setRefinedIdea(null)
    setRefineMode(false)
    try {
      await generate()
      toast.success('Ideas generadas — revisa y aprueba cada pieza')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar')
    }
  }

  function handleSelectIdea(type: IdeaType) {
    setSelectedIdeaType(type)
    setRefineMode(false)
    setRefinedIdea(null)
    setRefineFeedback('')
  }

  async function handleRefine() {
    if (!reviewItemId || !selectedIdeaType || !refineFeedback.trim()) return
    const item = items.find(i => i.id === reviewItemId)
    if (!item?.rawIdeas) return
    const currentIdea = refinedIdea ?? item.rawIdeas.ideas.find(i => i.type === selectedIdeaType)
    if (!currentIdea) return

    const currentSet = {
      ...item.rawIdeas,
      ideas: refinedIdea
        ? item.rawIdeas.ideas.map(i => i.type === selectedIdeaType ? refinedIdea : i)
        : item.rawIdeas.ideas,
    }

    try {
      const refined = await refineIdea({
        itemId: reviewItemId,
        ideaType: selectedIdeaType,
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
    if (!reviewItemId || !selectedIdeaType) return
    const item = items.find(i => i.id === reviewItemId)
    if (!item?.rawIdeas) return
    const originalIdea = item.rawIdeas.ideas.find(i => i.type === selectedIdeaType)
    const idea = refinedIdea ?? originalIdea
    if (!idea) return

    try {
      await updateItem({
        itemId: reviewItemId,
        patch: {
          selectedIdeaType,
          status: 'approved',
          idea: `${idea.name}: ${idea.summary}`,
          format: idea.contentType,
          channel: item.rawIdeas.channel,
          objective: idea.funnelObjective,
          kpi: idea.kpi,
          mainMessage: idea.development,
          cta: idea.cta,
          benchmarkReference: idea.benchmarkReference,
          observations: `Hook: ${idea.hook}\n\nHighsfield: ${idea.higgsfieldPrompt}\n\n${idea.whyWorks}`,
        },
      })

      const nextPending = items.find(i => i.id !== reviewItemId && i.status !== 'approved' && i.rawIdeas)
      if (nextPending) {
        setReviewItemId(nextPending.id)
        setSelectedIdeaType(null)
        setRefinedIdea(null)
        setRefineMode(false)
        setRefineFeedback('')
        toast.success('Idea aprobada — siguiente pieza')
      } else {
        setReviewItemId(null)
        setSelectedIdeaType(null)
        setRefinedIdea(null)
        toast.success('¡Todas las ideas aprobadas!')
      }
    } catch {
      toast.error('Error al aprobar idea')
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
    const recommended = calcPieces(channelMix.length)
    const piecesRationale =
      channelMix.length === 0
        ? 'Selecciona al menos un canal para ver la recomendación.'
        : channelMix.length === 1
        ? `1 canal activo → ${piecesCount} piezas (2/semana). Mínimo para mantener presencia sin sobrecargar la producción.`
        : channelMix.length === 2
        ? `2 canales activos → ${piecesCount} piezas (2-3/semana). Balance óptimo entre alcance y carga de producción.`
        : `${channelMix.length} canales activos → ${piecesCount} piezas (~3/semana). Distribución eficiente para múltiples plataformas.`

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
          <span className="text-muted-foreground">Ideas de contenido</span>
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
          <p className="text-sm text-violet-800">
            Pre-seleccioné <strong>Instagram y Facebook</strong> — los canales con mayor penetración en Ecuador. Confirma o ajusta, y calcularé el volumen mínimo necesario automáticamente.
          </p>
        </div>

        <div className="space-y-4">
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

          <div className={`rounded-xl border px-5 py-4 transition-colors ${channelMix.length > 0 ? 'border-foreground/20 bg-card' : 'border-dashed border-border bg-muted/20'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">Piezas recomendadas</p>
                  {piecesCount !== recommended && channelMix.length > 0 && (
                    <button
                      onClick={() => setPiecesCount(recommended)}
                      className="text-[10px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Restaurar ({recommended})
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{piecesRationale}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPiecesCount(p => Math.max(6, p - 2))}
                  disabled={piecesCount <= 6 || channelMix.length === 0}
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-border text-base font-medium text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-foreground w-8 text-center tabular-nums">{piecesCount}</span>
                <button
                  onClick={() => setPiecesCount(p => Math.min(16, p + 2))}
                  disabled={piecesCount >= 16 || channelMix.length === 0}
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-border text-base font-medium text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

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
            {generatingBrief ? 'Generando brief estratégico...' : 'Generar brief estratégico'}
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
            ← Regenerar estrategia
          </button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Generando ideas...' : 'Generar ideas de contenido'}
          </Button>
        </div>

        {generating && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
            Claude está generando 3 ideas por cada pieza de contenido...
          </div>
        )}
      </div>
    )
  }

  // ── STEP 3: Idea wizard or table ────────────────────────────────
  const hasIdeas = items.some(i => i.rawIdeas != null)
  const approvedCount = items.filter(i => i.status === 'approved').length
  const allApproved = approvedCount === items.length

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

  // ── STEP 3: 3-ideas wizard ──────────────────────────────────────
  const reviewItem = reviewItemId ? items.find(i => i.id === reviewItemId) : null
  const currentItemIdx = reviewItem ? items.indexOf(reviewItem) : -1

  // Item review view
  if (reviewItem?.rawIdeas) {
    const ideas = reviewItem.rawIdeas.ideas
    const activeIdea = ideas.find(i => i.type === selectedIdeaType)
    const displayIdea = selectedIdeaType === refinedIdea?.type ? (refinedIdea ?? activeIdea) : activeIdea

    return (
      <div className="p-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => { setReviewItemId(null); setSelectedIdeaType(null); setRefinedIdea(null); setRefineMode(false) }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al resumen
          </button>
          <span className="text-sm text-muted-foreground">
            Pieza {currentItemIdx + 1} de {items.length}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-foreground">{reviewItem.temporality}</h2>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${FUNNEL_COLORS[reviewItem.funnelStage]}`}>
              {FUNNEL_LABELS[reviewItem.funnelStage]}
            </span>
            <span className="text-sm text-muted-foreground">{reviewItem.rawIdeas.channel}</span>
            {reviewItem.rawIdeas.targetEmotion && (
              <span className="text-sm text-muted-foreground">· Emoción objetivo: {reviewItem.rawIdeas.targetEmotion}</span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">Selecciona la idea que mejor encaje para esta pieza</p>
        </div>

        {/* 3 idea selector cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {(['disruptiva', 'aspiracional', 'racional'] as IdeaType[]).map(type => {
            const idea = ideas.find(i => i.type === type)
            if (!idea) return null
            const cfg = IDEA_CONFIG[type]
            const isSelected = selectedIdeaType === type
            return (
              <button
                key={type}
                onClick={() => handleSelectIdea(type)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? `${cfg.border} ${cfg.bg} shadow-sm`
                    : 'border-border bg-card hover:border-muted-foreground/40'
                }`}
              >
                <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
                  {cfg.icon}
                  {cfg.label}
                </div>
                <p className="font-semibold text-foreground text-sm leading-snug mb-1">{idea.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{idea.summary}</p>
                <p className="mt-2 text-[11px] text-muted-foreground/70 line-clamp-2 italic">{idea.hook}</p>
                {isSelected && (
                  <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    <Check className="h-3 w-3" />
                    Seleccionada
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Detail + actions */}
        {displayIdea && (
          <div className="space-y-4">
            <IdeaDetail idea={displayIdea} isRefined={refinedIdea?.type === selectedIdeaType} />

            {refineMode ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">¿Qué ajuste quieres hacer a esta idea?</p>
                <textarea
                  value={refineFeedback}
                  onChange={e => setRefineFeedback(e.target.value)}
                  rows={3}
                  placeholder="Ej: Hazla más directa, cambia el tono a más informal, enfócate en el precio..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleRefine}
                    disabled={refining || !refineFeedback.trim()}
                    className="gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {refining ? 'Refinando...' : 'Generar versión refinada'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRefineMode(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {refinedIdea ? (
                  <>
                    <Button onClick={handleApproveIdea} className="gap-1.5">
                      <Check className="h-4 w-4" />
                      Aprobar versión refinada
                    </Button>
                    <Button variant="outline" onClick={() => setRefineMode(true)} className="gap-1.5">
                      <RefreshCw className="h-4 w-4" />
                      Ajustar más
                    </Button>
                    <Button variant="ghost" onClick={() => setRefinedIdea(null)} className="text-muted-foreground">
                      Volver a las 3 ideas originales
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleApproveIdea} className="gap-1.5">
                      <Check className="h-4 w-4" />
                      Aprobar esta idea
                    </Button>
                    <Button variant="outline" onClick={() => setRefineMode(true)} className="gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Proponer ajuste
                    </Button>
                  </>
                )}
              </div>
            )}
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
        <Button onClick={handleGenerate} disabled={generating} variant="outline" size="sm" className="gap-2 shrink-0">
          <Sparkles className="h-4 w-4" />
          {generating ? 'Regenerando...' : 'Regenerar ideas'}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">
            {allApproved ? '¡Plan completo!' : `${approvedCount} de ${items.length} piezas aprobadas`}
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
            Haz clic en cualquier pieza pendiente para revisar y aprobar sus 3 ideas
          </p>
        )}
      </div>

      {generating && (
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
          Claude está regenerando las ideas de contenido...
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isApproved = item.status === 'approved'
          const ideaCfg = item.selectedIdeaType ? IDEA_CONFIG[item.selectedIdeaType] : null
          return (
            <div
              key={item.id}
              onClick={() => !isApproved && item.rawIdeas && setReviewItemId(item.id)}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                isApproved
                  ? 'border-green-200 bg-green-50/50 cursor-default'
                  : item.rawIdeas
                  ? 'border-border bg-card cursor-pointer hover:border-foreground/40 hover:shadow-sm'
                  : 'border-border bg-card cursor-default'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.temporality ?? `Pieza ${idx + 1}`}</p>
                <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FUNNEL_COLORS[item.funnelStage]}`}>
                    {FUNNEL_LABELS[item.funnelStage]}
                  </span>
                  {item.rawIdeas?.channel && (
                    <span className="text-[11px] text-muted-foreground">{item.rawIdeas.channel}</span>
                  )}
                  {item.rawIdeas?.targetEmotion && (
                    <span className="text-[11px] text-muted-foreground">· {item.rawIdeas.targetEmotion}</span>
                  )}
                </div>
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
                    Pendiente
                    <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Final table when all approved */}
      {allApproved && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Plan aprobado</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Tipo</th>
                  {COLUMNS.map(col => (
                    <th key={col.key} className={`px-3 py-2.5 text-left text-xs font-medium text-muted-foreground ${col.width}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const ideaCfg = item.selectedIdeaType ? IDEA_CONFIG[item.selectedIdeaType] : null
                  return (
                    <tr key={item.id} className={`border-b border-border ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="px-3 py-2">
                        {ideaCfg && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ideaCfg.badge}`}>
                            {ideaCfg.icon}
                            {ideaCfg.label}
                          </span>
                        )}
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
