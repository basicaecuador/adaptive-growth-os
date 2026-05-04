'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Settings2, LayoutList, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganizations } from '@/hooks/use-organizations'
import { useBrands } from '@/hooks/use-brands'
import { CreateBrandDialog } from '@/components/brands/create-brand-dialog'
import type { Brand } from '@/types/domain'

function BrandInitials({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <span className="text-xl font-bold" style={{ color }}>
      {initials}
    </span>
  )
}

function BrandCard({ brand }: { brand: Brand }) {
  const color = brand.primaryColor || '#6366f1'
  const colorAlpha = `${color}15`

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-foreground/20 transition-all duration-200">
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: color }} />

      <div className="p-5 space-y-5">
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-border"
            style={{ backgroundColor: colorAlpha }}
          >
            {brand.logoUrl ? (
              <Image src={brand.logoUrl} alt={brand.name} fill className="object-contain p-1" />
            ) : (
              <BrandInitials name={brand.name} color={color} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-card-foreground leading-tight">{brand.name}</h3>
            <span
              className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: colorAlpha, color }}
            >
              {brand.isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {/* Primary action: Configurar marca */}
        <Link
          href={`/brands/${brand.id}`}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          <Settings2 className="h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none">Configurar marca</p>
            <p className="mt-0.5 text-[11px] opacity-80">Voz, tono, colores y más</p>
          </div>
        </Link>

        {/* Secondary action: Plan de contenidos */}
        <Link
          href={`/brands/${brand.id}/plans`}
          className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 hover:bg-muted/60 transition-colors"
        >
          <LayoutList className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-none">Plan de contenidos</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Ver y crear planes mensuales</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function BrandsPage() {
  const [open, setOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const { data: orgs } = useOrganizations()

  const activeOrgId = selectedOrgId || orgs?.[0]?.id || ''
  const { data: brands, isLoading } = useBrands(activeOrgId)

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Marcas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {brands?.length
              ? `${brands.length} marca${brands.length !== 1 ? 's' : ''} en tu organización`
              : 'Gestiona las marcas de tu organización'}
          </p>
        </div>
        {activeOrgId && (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva marca
          </Button>
        )}
      </div>

      {!orgs || orgs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <p className="text-sm text-muted-foreground">
            Primero crea una organización en <strong>Organizaciones</strong>
          </p>
        </div>
      ) : (
        <>
          {/* Org selector */}
          {orgs.length > 1 && (
            <div className="mb-6">
              <Select value={activeOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Seleccionar organización" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                  <div className="h-1.5 bg-muted" />
                  <div className="p-5 space-y-4">
                    <div className="flex gap-4">
                      <div className="h-14 w-14 rounded-xl bg-muted shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-muted rounded-xl" />
                      <div className="h-16 bg-muted rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : brands && brands.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}

              {/* Add brand card */}
              <button
                onClick={() => setOpen(true)}
                className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 flex flex-col items-center justify-center gap-3 hover:border-foreground/30 hover:bg-card transition-all text-center group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-border group-hover:border-foreground/30 transition-colors">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Agregar marca</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Nueva marca a gestionar</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Sparkles className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Sin marcas todavía</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                Crea tu primera marca para comenzar a planificar contenido con IA
              </p>
              <Button className="mt-6 gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Crear primera marca
              </Button>
            </div>
          )}
        </>
      )}

      {activeOrgId && (
        <CreateBrandDialog open={open} onOpenChange={setOpen} organizationId={activeOrgId} />
      )}
    </div>
  )
}
