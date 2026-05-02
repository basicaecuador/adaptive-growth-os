'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const OBJECTIVE_OPTIONS = [
  'Generar awareness',
  'Aumentar engagement',
  'Generar leads',
  'Aumentar ventas',
  'Retener clientes',
  'Lanzar producto',
  'Posicionar marca',
]

export default function PlansPage({ params }: Props) {
  const { brandId } = use(params)
  const router = useRouter()
  const { data: brand } = useBrandDetail(brandId)
  const { data: plans = [], isLoading } = useContentPlans(brandId)
  const { mutateAsync: createPlan, isPending: creating } = useCreateContentPlan(brandId)

  const now = new Date()
  const [showForm, setShowForm] = useState(false)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [context, setContext] = useState('')
  const [products, setProducts] = useState<PlanProduct[]>([{ name: '', description: '', objective: '' }])

  function addProduct() {
    setProducts(p => [...p, { name: '', description: '', objective: '' }])
  }

  function removeProduct(i: number) {
    setProducts(p => p.filter((_, idx) => idx !== i))
  }

  function updateProduct(i: number, field: keyof PlanProduct, value: string) {
    setProducts(p => p.map((prod, idx) => idx === i ? { ...prod, [field]: value } : prod))
  }

  async function handleCreate() {
    const validProducts = products.filter(p => p.name.trim())
    if (!validProducts.length) {
      toast.error('Agrega al menos un producto o servicio')
      return
    }
    try {
      const plan = await createPlan({ month, year, products: validProducts, context: context || undefined })
      toast.success('Plan creado — generando contenido...')
      router.push(`/brands/${brandId}/plans/${plan.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    }
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
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo plan
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="font-semibold text-card-foreground">Nuevo plan de contenidos</h2>

          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                min={2024}
                max={2030}
              />
            </div>
          </div>

          {/* Products */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Productos o servicios a promover</Label>
              <button
                onClick={addProduct}
                className="text-xs text-primary hover:underline"
              >
                + Agregar otro
              </button>
            </div>
            {products.map((prod, i) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Producto {i + 1}</span>
                  {products.length > 1 && (
                    <button onClick={() => removeProduct(i)} className="text-xs text-destructive hover:underline">
                      Eliminar
                    </button>
                  )}
                </div>
                <Input
                  placeholder="Nombre del producto o servicio"
                  value={prod.name}
                  onChange={e => updateProduct(i, 'name', e.target.value)}
                />
                <Input
                  placeholder="Descripción breve (ej: plan de internet con Disney+, alianza válida hasta el 30)"
                  value={prod.description}
                  onChange={e => updateProduct(i, 'description', e.target.value)}
                />
                <select
                  value={prod.objective}
                  onChange={e => updateProduct(i, 'objective', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Objetivo del funnel...</option>
                  {OBJECTIVE_OPTIONS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label>Contexto adicional <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Textarea
              placeholder="Ej: mes de mayor venta del año, competencia lanzó campaña agresiva, presupuesto limitado..."
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} disabled={creating} className="gap-2 flex-1">
              <Sparkles className="h-4 w-4" />
              {creating ? 'Creando...' : `Crear plan — ${MONTH_NAMES[month - 1]} ${year}`}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : plans.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">No hay planes de contenido aún.</p>
          <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4 gap-2">
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
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-ring transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-card-foreground">
                    {MONTH_NAMES[plan.month - 1]} {plan.year}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plan.products.length} producto{plan.products.length !== 1 ? 's' : ''} · {plan.products.map(p => p.name).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                  {plan.status === 'draft' ? 'Borrador' : plan.status === 'active' ? 'Activo' : 'Completado'}
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
