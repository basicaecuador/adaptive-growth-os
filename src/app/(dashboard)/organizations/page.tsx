'use client'

import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrganizations } from '@/hooks/use-organizations'
import { CreateOrgDialog } from '@/components/organizations/create-org-dialog'

export default function OrganizationsPage() {
  const [open, setOpen] = useState(false)
  const { data: orgs, isLoading } = useOrganizations()

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organizaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administra tus organizaciones</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva organización
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : orgs && orgs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.slug}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">Sin organizaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera organización para empezar.
          </p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva organización
          </Button>
        </div>
      )}

      <CreateOrgDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
