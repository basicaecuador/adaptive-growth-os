'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check, X, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useContentPlan, useGeneratePlan, useUpdatePlanItem } from '@/hooks/use-content-plans'
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
  const { mutateAsync: generate, isPending: generating } = useGeneratePlan(planId)
  const { mutateAsync: updateItem } = useUpdatePlanItem(planId)

  const plan = data?.plan
  const items = data?.items ?? []

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

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Cargando plan...</div>

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {plan ? `${MONTH_NAMES[plan.month - 1]} ${plan.year}` : '—'}
          </h1>
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
        <Button onClick={handleGenerate} disabled={generating} className="gap-2 shrink-0">
          <Sparkles className="h-4 w-4" />
          {generating ? 'Generando...' : items.length > 0 ? 'Regenerar plan' : 'Generar plan'}
        </Button>
      </div>

      {generating && (
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
          Claude está analizando tu marca y generando el plan estratégico...
        </div>
      )}

      {items.length === 0 && !generating ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">El plan está vacío. Genera el contenido con IA.</p>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generar plan
          </Button>
        </div>
      ) : (
        <>
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
                    {/* Status */}
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[item.status]}`}>
                        {item.status === 'draft' ? 'Revisión' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </td>

                    {/* Temporality */}
                    <td className="px-3 py-2">
                      <EditableCell
                        value={item.temporality}
                        onSave={v => handleUpdateField(item.id, 'temporality', v)}
                      />
                    </td>

                    {/* Funnel stage */}
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

                    {/* Editable text columns */}
                    {(['objective', 'idea'] as const).map(field => (
                      <td key={field} className="px-3 py-2 align-top">
                        <EditableCell
                          value={item[field]}
                          onSave={v => handleUpdateField(item.id, field, v)}
                          multiline
                        />
                      </td>
                    ))}

                    {/* Format */}
                    <td className="px-3 py-2">
                      <EditableCell
                        value={item.format}
                        onSave={v => handleUpdateField(item.id, 'format', v)}
                      />
                    </td>

                    {/* Channel */}
                    <td className="px-3 py-2">
                      <EditableCell
                        value={item.channel}
                        onSave={v => handleUpdateField(item.id, 'channel', v)}
                      />
                    </td>

                    {/* KPI */}
                    <td className="px-3 py-2 align-top">
                      <EditableCell
                        value={item.kpi}
                        onSave={v => handleUpdateField(item.id, 'kpi', v)}
                        multiline
                      />
                    </td>

                    {/* Main message */}
                    <td className="px-3 py-2 align-top">
                      <EditableCell
                        value={item.mainMessage}
                        onSave={v => handleUpdateField(item.id, 'mainMessage', v)}
                        multiline
                      />
                    </td>

                    {/* CTA */}
                    <td className="px-3 py-2">
                      <EditableCell
                        value={item.cta}
                        onSave={v => handleUpdateField(item.id, 'cta', v)}
                      />
                    </td>

                    {/* Benchmark */}
                    <td className="px-3 py-2 align-top">
                      <EditableCell
                        value={item.benchmarkReference}
                        onSave={v => handleUpdateField(item.id, 'benchmarkReference', v)}
                        multiline
                      />
                    </td>

                    {/* Observations */}
                    <td className="px-3 py-2 align-top">
                      <EditableCell
                        value={item.observations}
                        onSave={v => handleUpdateField(item.id, 'observations', v)}
                        multiline
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {item.status !== 'approved' && (
                          <button
                            onClick={() => handleStatus(item.id, 'approved')}
                            className="rounded p-1 text-green-600 hover:bg-green-100"
                            title="Aprobar"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatus(item.id, 'rejected')}
                            className="rounded p-1 text-red-500 hover:bg-red-100"
                            title="Rechazar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {item.status !== 'draft' && (
                          <button
                            onClick={() => handleStatus(item.id, 'draft')}
                            className="rounded p-1 text-muted-foreground hover:bg-muted"
                            title="Volver a revisión"
                          >
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
        </>
      )}
    </div>
  )
}
