'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Sparkles, ChevronRight, X, Globe, MessageCircle, Phone, FileText, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useContentPlans, useCreateContentPlan } from '@/hooks/use-content-plans'
import { useBrandDetail } from '@/hooks/use-brand-setup'
import { toast } from 'sonner'
import type { PlanProduct } from '@/types/domain'
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
          Con múltiples métodos se generará una misma idea con {value.length} cierres alternativos, uno por canal.
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
                <p className={`text-[11px] font-semibold leading-none ${active ? 'text-foreground' : 'text-foreground/80'}`}>
                  {id}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
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
  const [products, setProducts] = useState<PlanProduct[]>([{ name: '', description: '', objective: '', websiteUrl: '', leadMethods: [] }])

  function resetForm() {
    const d = getNextMonth()
    setMonth(d.month)
    setYear(d.year)
    setContext('')
    setProducts([{ name: '', description: '', objective: '', websiteUrl: '', leadMethods: [] }])
    setShowForm(false)
  }

  function addProduct() {
    setProducts(p => [...p, { name: '', description: '', objective: '', websiteUrl: '', leadMethods: [] }])
  }

  function removeProduct(i: number) {
    setProducts(p => p.filter((_, idx) => idx !== i))
  }

  function updateProduct(i: number, field: keyof PlanProduct, value: string) {
    setProducts(p => p.map((prod, idx) => {
      if (idx !== i) return prod
      const updated = { ...prod, [field]: value }
      if (field === 'objective' && value !== 'Generar leads') updated.leadMethods = []
      return updated
    }))
  }

  function updateLeadMethods(i: number, methods: string[]) {
    setProducts(p => p.map((prod, idx) => idx !== i ? prod : { ...prod, leadMethods: methods }))
  }

  async function handleCreate() {
    const validProducts = products.filter(p => p.name.trim())
    if (!validProducts.length) {
      toast.error('Agrega al menos un producto o servicio')
      return
    }
    try {
      const plan = await createPlan({ month, year, products: validProducts, context: context || undefined })
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

          {/* Month picker — visual grid */}
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

          {/* Products */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-card-foreground">Productos o servicios a promover</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Uno por producto — Claude genera un funnel independiente para cada uno</p>
              </div>
              <button
                onClick={addProduct}
                className="shrink-0 text-xs font-medium text-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </button>
            </div>

            <div className="space-y-3">
              {products.map((prod, i) => (
                <div key={i} className="rounded-lg border border-border bg-background">
                  {/* Product header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {products.length > 1 ? `Producto ${i + 1}` : 'Producto / Servicio'}
                    </span>
                    {products.length > 1 && (
                      <button
                        onClick={() => removeProduct(i)}
                        className="rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <Input
                      placeholder="Nombre del producto o servicio"
                      value={prod.name}
                      onChange={e => updateProduct(i, 'name', e.target.value)}
                    />
                    <Textarea
                      placeholder="Descripción: qué es, qué lo hace diferente, promoción vigente, fecha límite, precio..."
                      value={prod.description}
                      onChange={e => updateProduct(i, 'description', e.target.value)}
                      rows={3}
                    />

                    {/* Website URL */}
                    <div className="space-y-1">
                      <Input
                        type="url"
                        placeholder="Página web del producto (opcional)"
                        value={prod.websiteUrl ?? ''}
                        onChange={e => updateProduct(i, 'websiteUrl', e.target.value)}
                      />
                      <p className="text-[11px] text-muted-foreground px-0.5">
                        Si tiene landing page o ficha comercial, agrégala para enriquecer el contenido
                      </p>
                    </div>

                    {/* Objective */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-foreground/70">Objetivo principal</p>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
                        {OBJECTIVE_OPTIONS.map(o => {
                          const active = prod.objective === o
                          return (
                            <button
                              key={o}
                              type="button"
                              onClick={() => updateProduct(i, 'objective', o)}
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

                    {/* Lead methods — only when "Generar leads" */}
                    {prod.objective === 'Generar leads' && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900 p-3">
                        <LeadMethodSelector
                          value={prod.leadMethods ?? []}
                          onChange={methods => updateLeadMethods(i, methods)}
                        />
                      </div>
                    )}
                  </div>
                </div>
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
        <Button onClick={() => setShowForm(true)} className="gap-2">
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
          <Button onClick={() => setShowForm(true)} className="mt-5 gap-2">
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
