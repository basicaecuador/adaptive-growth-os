'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Megaphone, Plus, Settings2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganizations } from '@/hooks/use-organizations'
import { useBrands } from '@/hooks/use-brands'
import { CreateBrandDialog } from '@/components/brands/create-brand-dialog'

export default function BrandsPage() {
  const [open, setOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const { data: orgs } = useOrganizations()

  const activeOrgId = selectedOrgId || orgs?.[0]?.id || ''
  const { data: brands, isLoading } = useBrands(activeOrgId)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Marcas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona las marcas de tu organización
          </p>
        </div>
        {activeOrgId && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva marca
          </Button>
        )}
      </div>

      {!orgs || orgs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Primero crea una organización en <strong>Organizaciones</strong>
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Select value={activeOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-64">
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

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : brands && brands.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => (
                <div key={brand.id} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                        {brand.logoUrl ? (
                          <Image src={brand.logoUrl} alt={brand.name} fill className="object-contain" />
                        ) : (
                          <Megaphone className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{brand.name}</p>
                        <p className="text-xs text-muted-foreground">{brand.slug}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/brands/${brand.id}/plans`}>
                        <Button variant="ghost" size="icon" title="Plan de contenidos">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                      <Link href={`/brands/${brand.id}`}>
                        <Button variant="ghost" size="icon" title="Configurar marca">
                          <Settings2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">Sin marcas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu primera marca para esta organización.
              </p>
              <Button className="mt-4" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva marca
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
