'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Sparkles, ChevronRight, X, Globe, MessageCircle, Phone, FileText, Send, MessageSquare, ChevronDown, Users, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useContentPlans, useCreateContentPlan } from '@/hooks/use-content-plans'
import { useBrandDetail } from '@/hooks/use-brand-setup'
import { toast } from 'sonner'
import type { PlanProduct, PlanAudience } from '@/types/domain'
import { useRouter } from 'next/navigation'

interface Props {
  params: Promise<{ brandId: string }>
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const OBJECTIVE_OPTIONS = [
  'Generar awareness',
  'Aumentar engagement',
  'Generar leads',
  'Aumentar ventas',
  'Retener clientes',
  'Lanzar producto',
  'Posicionar marca',
]

const LEAD_METHODS = [
  { id: 'Formulario de Meta', icon: FileText, description: 'Lead form nativo en Meta' },
  { id: 'Landing page', icon: Globe, description: 'Página externa de conversión' },
  { id: 'WhatsApp', icon: MessageCircle, description: 'Chat directo por WhatsApp' },
  { id: 'Messenger', icon: MessageSquare, description: 'Chat de Facebook' },
  { id: 'DM de Instagram', icon: Send, description: 'Mensaje directo en Instagram' },
  { id: 'Llamada telefónica', icon: Phone, description: 'Clic para llamar' },
]

function getNextMonth() {
  const now = new Date()
  const next = now.getMonth() + 2
  if (next > 12) return { month: 1, year: now.getFullYear() + 1 }
  return { month: next, year: now.getFullYear() }
}

function LeadMethodSelector({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">¿Cómo capturas los leads?</p>
        {value.length > 0 && (
          <span className="text-[10px] text-muted-foreground">{value.length} seleccionado{value.length > 1 ? 's' : ''}</span>
        )}
      </div>
      {value.length > 1 && (
        <p className="text-[10px] text-violet-600 dark:text-violet-400 leading-snug">
          Con múltiples métodos se genera la misma idea con {value.length} cierres alternativos.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {LEAD_METHODS.map(({ id, icon: Icon, description }) => {
          const active = value.includes(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(active ? value.filter(v => v !== id) : [...value, id])}
              className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all ${
                active
                  ? 'border-foreground bg-foreground/5 ring-1 ring-foreground/20'
                  : 'border-border bg-background hover:border-foreground/30 hover:bg-muted/40'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
              <div>
                <p className={`text-[11px] font-semibold leading-none ${active ? 'text-foreground' : 'text-foreground/80'}`}>{id}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  function add() {
    const trimmed = draft.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setDraft('')
  }
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="h-8 text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0 h-8 px-2.5">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
              {v}
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AudienceCard({
  audience,
  index,
  total,
  onChange,
  onRemove,
}: {
  audience: PlanAudience
  index: number
  total: number
  onChange: (a: PlanAudience) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {total > 1 ? `Audiencia ${index + 1}` : 'Audiencia objetivo'}
          </span>
          {audience.name && (
            <span className="text-xs text-foreground font-medium truncate">{audience.name}</span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 ml-auto text-muted-foreground transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-2 rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {expanded && (
        <div className="p-4 space-y-3">
          <Input
            placeholder="Nombre de la audiencia (ej: Emprendedores 30-45 años)"
            value={audience.name}
            onChange={e => onChange({ ...audience, name: e.target.value })}
          />
          <Textarea
            placeholder="Descripción: quiénes son, qué los caracteriza (opcional)"
            value={audience.description ?? ''}
            onChange={e => onChange({ ...audience, description: e.target.value })}
            rows={2}
          />
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Creencias limitantes</p>
            <TagInput
              value={audience.beliefs ?? []}
              onChange={v => onChange({ ...audience, beliefs: v })}
              placeholder="Ej: Es muy caro para lo que ofrece"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Dolores / frustraciones</p>
            <TagInput
              value={audience.pains ?? []}
              onChange={v => onChange({ ...audience, pains: v })}
              placeholder="Ej: Pierde clientes por falta de presencia online"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Jobs To Be Done (qué quieren lograr)</p>
            <TagInput
              value={audience.jtbd ?? []}
              onChange={v => onChange({ ...audience, jtbd: v })}
              placeholder="Ej: Atraer clientes sin depender de referidos"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCard({
  product,
  index,
  total,
  onChange,
  onRemove,
  audienceNames,
}: {
  product: PlanProduct
  index: number
  total: number
  onChange: (p: PlanProduct) => void
  onRemove: () => void
  audienceNames: string[]
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  function updateLeadMethods(methods: string[]) {
    onChange({ ...product, leadMethods: methods })
  }

  function toggleAudience(name: string) {
    const cur = product.audiences ?? []
    onChange({ ...product, audiences: cur.includes(name) ? cur.filter(a => a !== name) : [...cur, name] })
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {total > 1 ? `Producto ${index + 1}` : 'Producto / Servicio'}
        </span>
        {total > 1 && (
          <button type="button" onClick={onRemove} className="rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <Input
          placeholder="Nombre del producto o servicio"
          value={product.name}
          onChange={e => onChange({ ...product, name: e.target.value })}
        />
        <Textarea
          placeholder="Descripción: qué es, qué lo hace diferente, características principales..."
          value={product.description}
          onChange={e => onChange({ ...product, description: e.target.value })}
          rows={2}
        />

        {/* Objetivo */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground/70">Objetivo principal</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {OBJECTIVE_OPTIONS.map(o => {
              const active = product.objective === o
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => onChange({ ...product, objective: o, leadMethods: o !== 'Generar leads' ? [] : product.leadMethods })}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-medium text-left transition-all leading-snug ${
                    active
                      ? 'border-foreground bg-foreground/5 text-foreground ring-1 ring-foreground/20'
                      : 'border-border bg-background text-foreground/70 hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  {o}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lead methods */}
        {product.objective === 'Generar leads' && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900 p-3">
            <LeadMethodSelector
              value={product.leadMethods ?? []}
              onChange={updateLeadMethods}
            />
          </div>
        )}

        {/* Audiences for this product */}
        {audienceNames.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-2">
            <p className="text-xs font-semibold text-foreground/70">¿A qué audiencias se dirige este producto?</p>
            <div className="flex flex-wrap gap-1.5">
              {audienceNames.map(name => {
                const active = (product.audiences ?? []).includes(name)
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleAudience(name)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
            {(product.audiences ?? []).length === 0 && (
              <p className="text-[10px] text-muted-foreground/70">Selecciona al menos una audiencia para personalizar las piezas</p>
            )}
          </div>
        )}

        {/* Web URL */}
        <Input
          type="url"
          placeholder="Página web del producto (opcional)"
          value={product.websiteUrl ?? ''}
          onChange={e => onChange({ ...product, websiteUrl: e.target.value })}
        />

        {/* Advanced fields toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? '' : '-rotate-90'}`} />
          {showAdvanced ? 'Ocultar' : 'Detalles adicionales'} — promoción, precios, beneficios, restricciones
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Precio actual</p>
                <Input
                  placeholder="Ej: $199 / $1,500/mes"
                  value={product.currentPrice ?? ''}
                  onChange={e => onChange({ ...product, currentPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Precio anterior (tachado)</p>
                <Input
                  placeholder="Ej: $250"
                  value={product.previousPrice ?? ''}
                  onChange={e => onChange({ ...product, previousPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Promoción vigente</p>
              <Input
                placeholder="Ej: 20% descuento hasta el 30 de mayo"
                value={product.promotion ?? ''}
                onChange={e => onChange({ ...product, promotion: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Beneficios clave</p>
              <TagInput
                value={product.keyBenefits ?? []}
                onChange={v => onChange({ ...product, keyBenefits: v })}
                placeholder="Ej: Entrega en 24 horas"
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Diferenciadores vs competencia</p>
              <Textarea
                placeholder="Ej: Única plataforma con IA incluida, soporte 24/7 en español..."
                value={product.differentials ?? ''}
                onChange={e => onChange({ ...product, differentials: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">La comunicación DEBE incluir</p>
              <TagInput
                value={product.communicationMandatories ?? []}
                onChange={v => onChange({ ...product, communicationMandatories: v })}
                placeholder="Ej: Mostrar el logo siempre"
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Restricciones legales / disclaimers</p>
              <Input
                placeholder="Ej: No prometer rendimientos garantizados"
                value={product.legalRestrictions ?? ''}
                onChange={e => onChange({ ...product, legalRestrictions: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function emptyProduct(): PlanProduct {
  return { name: '', description: '', objective: '', websiteUrl: '', leadMethods: [] }
}

function emptyAudience(): PlanAudience {
  return { name: '', description: '', beliefs: [], pains: [], jtbd: [] }
}

export default function PlansPage({ params }: Props) {
  const { brandId } = use(params)
  const router = useRouter()
  const { data: brand } = useBrandDetail(brandId)
  const { data: plans = [], isLoading } = useContentPlans(brandId)
  const { mutateAsync: createPlan, isPending: creating } = useCreateContentPlan(brandId)

  const defaults = getNextMonth()
  const [showForm, setShowForm] = useState(false)
  const [month, setMonth] = useState(defaults.month)
  const [year, setYear] = useState(defaults.year)
  const [context, setContext] = useState('')
  const [products, setProducts] = useState<PlanProduct[]>([emptyProduct()])
  const [audiences, setAudiences] = useState<PlanAudience[]>([emptyAudience()])

  function openForm() {
    const d = getNextMonth()
    setMonth(d.month)
    setYear(d.year)
    setContext('')
    setProducts([emptyProduct()])
    const brandAuds = brand?.audienciasMarca ?? []
    setAudiences(brandAuds.length > 0 ? brandAuds.map(a => ({ ...a })) : [emptyAudience()])
    setShowForm(true)
  }

  function resetForm() {
    const d = getNextMonth()
    setMonth(d.month)
    setYear(d.year)
    setContext('')
    setProducts([emptyProduct()])
    setAudiences([emptyAudience()])
    setShowForm(false)
  }

  const audienceNames = audiences.map(a => a.name).filter(Boolean)
  const brandAuds: PlanAudience[] = brand?.audienciasMarca ?? []
  const hasBrandAuds = brandAuds.length > 0
  const selectedBrandNames = new Set(
    audiences.filter(a => brandAuds.some(b => b.name === a.name)).map(a => a.name)
  )
  const customAuds = audiences.filter(a => !brandAuds.some(b => b.name === a.name))

  function toggleBrandAudience(aud: PlanAudience) {
    if (selectedBrandNames.has(aud.name)) {
      setAudiences(prev => prev.filter(a => a.name !== aud.name))
    } else {
      setAudiences(prev => [...prev, { ...aud }])
    }
  }

  function addCustomAudience() {
    setAudiences(prev => [...prev, emptyAudience()])
  }

  async function handleCreate() {
    const validProducts = products.filter(p => p.name.trim())
    if (!validProducts.length) {
      toast.error('Agrega al menos un producto o servicio')
      return
    }
    const validAudiences = audiences.filter(a => a.name.trim())
    try {
      const plan = await createPlan({
        month,
        year,
        products: validProducts,
        audiences: validAudiences.length ? validAudiences : undefined,
        context: context || undefined,
      })
      toast.success('Plan creado')
      router.push(`/brands/${brandId}/plans/${plan.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  if (showForm) {
    return (
      <div className="p-8 max-w-2xl">
        <button
          onClick={resetForm}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuevo plan de contenidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{brand?.name}</p>
        </div>

        <div className="space-y-5">

          {/* Month picker */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">¿Para qué mes?</h2>
              <Input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                min={2024}
                max={2030}
                className="w-20 text-center font-medium text-sm h-8"
              />
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {MONTH_SHORT.map((m, i) => {
                const selected = month === i + 1
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMonth(i + 1)}
                    className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-foreground text-background'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Audiences */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-card-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Audiencias objetivo
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Claude personaliza cada pieza según las audiencias seleccionadas
              </p>
            </div>

            {hasBrandAuds ? (
              <div className="space-y-3">
                {/* Brand audience chips */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Audiencias configuradas en la marca
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {brandAuds.map(aud => {
                      const selected = selectedBrandNames.has(aud.name)
                      return (
                        <button
                          key={aud.name}
                          type="button"
                          onClick={() => toggleBrandAudience(aud)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                            selected
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                          {aud.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Preview of selected brand audiences */}
                {selectedBrandNames.size > 0 && (
                  <div className="space-y-2">
                    {audiences
                      .filter(a => selectedBrandNames.has(a.name))
                      .map(a => (
                        <div key={a.name} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-foreground">{a.name}</p>
                            <button
                              type="button"
                              onClick={() => toggleBrandAudience(a)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          {a.description && (
                            <p className="text-[11px] text-muted-foreground">{a.description}</p>
                          )}
                          {(a.beliefs?.length || a.pains?.length || a.jtbd?.length) ? (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {a.beliefs?.slice(0, 2).map(b => (
                                <span key={b} className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">{b}</span>
                              ))}
                              {a.pains?.slice(0, 2).map(p => (
                                <span key={p} className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] text-red-700 dark:text-red-400">{p}</span>
                              ))}
                              {a.jtbd?.slice(0, 1).map(j => (
                                <span key={j} className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">{j}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}

                {/* Custom audiences */}
                {customAuds.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Audiencias adicionales para este plan
                    </p>
                    {customAuds.map(aud => {
                      const realIdx = audiences.findIndex(a => a === aud)
                      return (
                        <AudienceCard
                          key={realIdx}
                          audience={aud}
                          index={realIdx}
                          total={customAuds.length}
                          onChange={updated => setAudiences(a => a.map((x, i) => i === realIdx ? updated : x))}
                          onRemove={() => setAudiences(a => a.filter((_, i) => i !== realIdx))}
                        />
                      )
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addCustomAudience}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar audiencia personalizada para este plan
                </button>
              </div>
            ) : (
              /* No brand audiences configured */
              <div className="space-y-3">
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Sin audiencias configuradas en la marca</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Ve a{' '}
                      <a
                        href={`/brands/${brandId}`}
                        className="underline hover:text-foreground"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Configurar marca
                      </a>
                      {' '}→ sección "Audiencias de la marca" y guarda. Luego vuelve aquí y verás los chips de selección.
                    </p>
                  </div>
                </div>
                {audiences.map((aud, i) => (
                  <AudienceCard
                    key={i}
                    audience={aud}
                    index={i}
                    total={audiences.length}
                    onChange={updated => setAudiences(a => a.map((x, idx) => idx === i ? updated : x))}
                    onRemove={() => setAudiences(a => a.filter((_, idx) => idx !== i))}
                  />
                ))}
                <button
                  type="button"
                  onClick={addCustomAudience}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar audiencia para este plan
                </button>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-card-foreground">Productos o servicios a promover</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Claude genera un funnel independiente para cada uno</p>
              </div>
              <button
                type="button"
                onClick={() => setProducts(p => [...p, emptyProduct()])}
                className="shrink-0 text-xs font-medium text-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </button>
            </div>

            <div className="space-y-3">
              {products.map((prod, i) => (
                <ProductCard
                  key={i}
                  product={prod}
                  index={i}
                  total={products.length}
                  onChange={updated => setProducts(p => p.map((x, idx) => idx === i ? updated : x))}
                  onRemove={() => setProducts(p => p.filter((_, idx) => idx !== i))}
                  audienceNames={audienceNames}
                />
              ))}
            </div>
          </div>

          {/* Context */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-card-foreground">
                Contexto del mes
                <span className="ml-2 text-muted-foreground font-normal text-sm">(opcional)</span>
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Información que Claude debe considerar al generar la estrategia
              </p>
            </div>
            <Textarea
              placeholder="Ej: mes de mayor venta del año, competencia lanzó campaña agresiva, presupuesto limitado, evento especial el día 15..."
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            {creating ? 'Creando plan...' : `Crear plan — ${MONTH_NAMES[month - 1]} ${year}`}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href={`/brands/${brandId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a {brand?.name ?? 'marca'}
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Planes de contenido</h1>
          <p className="mt-1 text-sm text-muted-foreground">{brand?.name}</p>
        </div>
        <Button onClick={openForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo plan
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <p className="font-medium text-foreground">Sin planes aún</p>
          <p className="mt-1 text-sm text-muted-foreground">Crea el primer plan de contenidos para esta marca</p>
          <Button onClick={openForm} className="mt-5 gap-2">
            <Plus className="h-4 w-4" />
            Crear primer plan
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <Link
              key={plan.id}
              href={`/brands/${brandId}/plans/${plan.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">
                    {MONTH_NAMES[plan.month - 1].slice(0, 3)}
                  </span>
                  <span className="text-xl font-bold text-foreground leading-tight">{plan.year.toString().slice(2)}</span>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">
                    {MONTH_NAMES[plan.month - 1]} {plan.year}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.products.length} producto{plan.products.length !== 1 ? 's' : ''} · {plan.products.map(p => p.name).filter(Boolean).join(', ')}
                  </p>
                  {plan.audiences?.length > 0 && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{plan.audiences.length} audiencia{plan.audiences.length !== 1 ? 's' : ''}</p>
                  )}
                  {plan.channelMix?.length > 0 && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{plan.channelMix.join(' · ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className={
                  plan.status === 'draft' && plan.strategicBrief ? 'bg-violet-100 text-violet-700 border-violet-200' : ''
                }>
                  {plan.status === 'draft' && !plan.strategicBrief ? 'Configurar' :
                   plan.status === 'draft' ? 'En progreso' :
                   plan.status === 'active' ? 'Activo' : 'Completado'}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
