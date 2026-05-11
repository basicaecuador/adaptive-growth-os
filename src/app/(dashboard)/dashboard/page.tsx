'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Settings2, LayoutList, Sparkles, ArrowRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrganizations } from '@/hooks/use-organizations'
import { useBrands } from '@/hooks/use-brands'
import { useContentPlans } from '@/hooks/use-content-plans'
import { CreateBrandDialog } from '@/components/brands/create-brand-dialog'
import type { Brand } from '@/types/domain'

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getNextPlanningMonth() {
  const now = new Date()
  const m = now.getMonth() + 2
  if (m > 12) return { month: 1, year: now.getFullYear() + 1 }
  return { month: m, year: now.getFullYear() }
}

function BrandPlanCard({ brand }: { brand: Brand }) {
  const { data: plans = [] } = useContentPlans(brand.id)
  const color = brand.primaryColor || '#6366f1'
  const colorAlpha = `${color}15`

  const now = new Date()
  const cm = now.getMonth() + 1
  const cy = now.getFullYear()
  const next = getNextPlanningMonth()

  const currentPlan = plans.find(p => p.month === cm && p.year === cy)
  const nextPlan = plans.find(p => p.month === next.month && p.year === next.year)

  const activePlan = nextPlan || currentPlan
  const activePlanMonth = nextPlan ? next.month : cm
  const activePlanYear = nextPlan ? next.year : cy

  const statusLabel = !activePlan
    ? { text: 'Sin plan', color: 'text-muted-foreground', dot: 'bg-muted-foreground/40' }
    : !activePlan.strategicBrief
    ? { text: 'Pendiente brief', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' }
    : activePlan.status === 'active'
    ? { text: 'Plan activo', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' }
    : { text: 'En progreso', color: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-foreground/20 transition-all duration-200 flex flex-col">
      <div className="h-1" style={{ backgroundColor: color }} />

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-border"
            style={{ backgroundColor: colorAlpha }}
          >
            {brand.logoUrl ? (
              <Image src={brand.logoUrl} alt={brand.name} fill className="object-contain p-1" />
            ) : (
              <span className="text-base font-bold" style={{ color }}>
                {brand.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-card-foreground truncate">{brand.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${statusLabel.dot}`} />
              <span className={`text-[11px] font-medium ${statusLabel.color}`}>{statusLabel.text}</span>
            </div>
          </div>
        </div>

        {/* Plan month indicator */}
        {activePlan && (
          <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {MONTH_SHORT[activePlanMonth - 1]} {activePlanYear}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {activePlan.piecesCount} piezas
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          <Link
            href={`/brands/${brand.id}/plans`}
            className="flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <span>{activePlan ? 'Ver plan' : 'Crear plan'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/brands/${brand.id}`}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Configurar marca
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: orgs } = useOrganizations()
  const activeOrgId = orgs?.[0]?.id || ''
  const { data: brands = [], isLoading } = useBrands(activeOrgId)
  const [open, setOpen] = useState(false)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  const next = getNextPlanningMonth()

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
            {brands.length > 0 && ` · ${brands.length} marca${brands.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {activeOrgId && (
          <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            Nueva marca
          </Button>
        )}
      </div>

      {/* Planning banner */}
      {brands.length > 0 && (
        <div className="mb-7 rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-950/30 p-4 flex items-center gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
            <Sparkles className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" style={{ height: 18, width: 18 }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Es hora de planificar {MONTH_NAMES[next.month - 1]} {next.year}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecciona una marca y genera el brief estratégico del próximo mes
            </p>
          </div>
        </div>
      )}

      {/* Brand grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : brands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map(brand => (
            <BrandPlanCard key={brand.id} brand={brand} />
          ))}
          <button
            onClick={() => setOpen(true)}
            className="rounded-2xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center gap-2.5 hover:border-foreground/30 hover:bg-muted/20 transition-all group min-h-[180px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-border group-hover:border-foreground/30 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Nueva marca
            </p>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <LayoutList className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h2 className="font-semibold text-foreground">Sin marcas todavía</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Crea tu primera marca para empezar a planificar contenido con IA
          </p>
          {activeOrgId ? (
            <Button className="mt-6 gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Crear primera marca
            </Button>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Primero crea una{' '}
              <Link href="/organizations" className="underline hover:text-foreground">organización</Link>
            </p>
          )}
        </div>
      )}

      {activeOrgId && (
        <CreateBrandDialog open={open} onOpenChange={setOpen} organizationId={activeOrgId} />
      )}
    </div>
  )
}
