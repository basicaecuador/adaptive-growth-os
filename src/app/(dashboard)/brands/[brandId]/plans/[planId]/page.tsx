'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check, X, Pencil, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useContentPlan,
  useGenerateBrief,
  useGeneratePlan,
  useUpdatePlan,
  useUpdatePlanItem,
} from '@/hooks/use-content-plans'
import { toast } from 'sonner'
import type { ContentPlanItem, FunnelStage } from '@/types/domain'

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
  { key: 'benchmarkReference', label: 'Benchmark', width: 'w-44' },
  { key: 'observations', label: 'Observaciones', width: 'w-48' },
]

const CHANNELS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Email', 'WhatsApp']

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

export default function PlanDetailPage({ params }: Props) {
  const { brandId, planId } = use(params)
  const { data, isLoading } = useContentPlan(planId)
  const { mutateAsync: generateBrief, isPending: generatingBrief } = useGenerateBrief(planId)
  const { mutateAsync: generate, isPending: generating } = useGeneratePlan(planId)
  const { mutateAsync: updatePlan, isPending: savingBrief } = useUpdatePlan(planId)
  const { mutateAsync: updateItem } = useUpdatePlanItem(planId)

  const plan = data?.plan
  const items = data?.items ?? []

  // Step 1 local state
  const [channelMix, setChannelMix] = useState<string[]>(['Instagram', 'Facebook'])
  const [funnelFocus, setFunnelFocus] = useState('balanced')
  const [piecesCount, setPiecesCount] = useState(12)

  // Step 2 brief editing
  const [editingBrief, setEditingBrief] = useState(false)
  const [briefDraft, setBriefDraft] = useState('')

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
    try {
      await generate()
      toast.success('Plan generado correctamente')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar')
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

  // ── Shared header ──────────────────────────────────────────────
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
    return (
      <div className="p-8 max-w-2xl">
        {Header}

        {/* Progress */}
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

        <div className="space-y-6">
          {/* Channels */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-card-foreground">Canales</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">¿En qué plataformas publicará la marca este mes?</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map(ch => (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    channelMix.includes(ch)
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/50'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Funnel focus */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-card-foreground">Enfoque del mes</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">¿Cuál es la prioridad estratégica de este período?</p>
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

          {/* Pieces count */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-card-foreground">Volumen de contenido</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Número estimado de piezas para el mes</p>
            </div>
            <div className="flex gap-2">
              {[8, 10, 12, 14, 16].map(n => (
                <button
                  key={n}
                  onClick={() => setPiecesCount(n)}
                  className={`flex h-10 w-14 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                    piecesCount === n
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/50'
                  }`}
                >
                  {n}
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

        {/* Progress */}
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
          <span className="text-muted-foreground">Plan de contenidos</span>
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
            {generating ? 'Generando plan...' : 'Generar plan de contenidos'}
          </Button>
        </div>

        {generating && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
            Claude está generando el plan basado en el brief aprobado...
          </div>
        )}
      </div>
    )
  }

  // ── STEP 3: Content table ───────────────────────────────────────
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
        <Button onClick={handleGenerate} disabled={generating} variant="outline" className="gap-2 shrink-0">
          <Sparkles className="h-4 w-4" />
          {generating ? 'Regenerando...' : 'Regenerar plan'}
        </Button>
      </div>

      {generating && (
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
          Claude está regenerando el plan estratégico...
        </div>
      )}

      {/* Summary stats */}
      <div className="mb-4 flex gap-4 text-sm">
        <span className="text-muted-foreground">{items.length} piezas</span>
        <span className="text-green-600">{items.filter(i => i.status === 'approved').length} aprobadas</span>
        <span className="text-muted-foreground">{items.filter(i => i.status === 'draft').length} en revisión</span>
        {items.filter(i => i.status === 'rejected').length > 0 && (
          <span className="text-red-600">{items.filter(i => i.status === 'rejected').length} rechazadas</span>
        )}
      </div>

      {/* Table */}
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
                className={`border-b border-border transition-colors ${
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

                <td className="px-3 py-2">
                  <EditableCell value={item.format} onSave={v => handleUpdateField(item.id, 'format', v)} />
                </td>

                <td className="px-3 py-2">
                  <EditableCell value={item.channel} onSave={v => handleUpdateField(item.id, 'channel', v)} />
                </td>

                <td className="px-3 py-2 align-top">
                  <EditableCell value={item.kpi} onSave={v => handleUpdateField(item.id, 'kpi', v)} multiline />
                </td>

                <td className="px-3 py-2 align-top">
                  <EditableCell value={item.mainMessage} onSave={v => handleUpdateField(item.id, 'mainMessage', v)} multiline />
                </td>

                <td className="px-3 py-2">
                  <EditableCell value={item.cta} onSave={v => handleUpdateField(item.id, 'cta', v)} />
                </td>

                <td className="px-3 py-2 align-top">
                  <EditableCell value={item.benchmarkReference} onSave={v => handleUpdateField(item.id, 'benchmarkReference', v)} multiline />
                </td>

                <td className="px-3 py-2 align-top">
                  <EditableCell value={item.observations} onSave={v => handleUpdateField(item.id, 'observations', v)} multiline />
                </td>

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
                    {item.status !== 'draft' && (
                      <button onClick={() => handleStatus(item.id, 'draft')} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Volver a revisión">
                        <Pencil className="h-3.5 w-3.5" />
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
