'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, Shield, Plus, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const ORG_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  product_owner: 'Product Owner',
  content: 'Content',
  viewer: 'Viewer',
}

const BRAND_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  product_owner: 'Product Owner',
  content: 'Content',
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'content', label: 'Content' },
]

interface OrgMember {
  id: string
  userId: string
  email: string
  name: string
  role: string
  joinedAt: string
}

interface BrandMemberRow {
  id: string
  brandId: string
  brandName: string
  userId: string
  email: string
  role: string
}

interface OrgInfo {
  id: string
  name: string
  slug: string
}

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [brandMembers, setBrandMembers] = useState<BrandMemberRow[]>([])
  const [loading, setLoading] = useState(true)

  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState('product_owner')
  const [adding, setAdding] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/members')
      const { data } = await res.json()
      setOrg(data.org)
      setMembers(data.members ?? [])
      setBrandMembers(data.brandMembers ?? [])
    } catch {
      toast.error('Error al cargar miembros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    const email = addEmail.trim()
    if (!email) return
    setAdding(true)
    try {
      const res = await fetch('/api/settings/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: addRole }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error || 'Error al agregar'); return }
      setAddEmail('')
      toast.success('Miembro agregado')
      load()
    } catch {
      toast.error('Error inesperado')
    } finally {
      setAdding(false)
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    try {
      const res = await fetch(`/api/settings/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) { toast.error('Error al cambiar rol'); return }
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m))
      toast.success('Rol actualizado')
    } catch {
      toast.error('Error inesperado')
    }
  }

  async function handleRemove(memberId: string) {
    try {
      const res = await fetch(`/api/settings/members/${memberId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Error al eliminar'); return }
      setMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success('Miembro eliminado')
    } catch {
      toast.error('Error inesperado')
    }
  }

  // Group brand members by email for the summary view
  const brandsByUser = brandMembers.reduce<Record<string, { email: string; brands: { name: string; role: string }[] }>>((acc, bm) => {
    if (!acc[bm.email]) acc[bm.email] = { email: bm.email, brands: [] }
    acc[bm.email].brands.push({ name: bm.brandName, role: bm.role })
    return acc
  }, {})

  if (loading) {
    return (
      <div className="p-8 max-w-3xl space-y-5">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ajustes</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Gestiona tu organización y controla los accesos</p>
      </div>

      {/* Org info */}
      {org && (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-card-foreground">{org.name}</p>
            <p className="text-xs text-muted-foreground font-mono">/{org.slug}</p>
          </div>
        </div>
      )}

      {/* Org members */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-card-foreground">Miembros de la organización</h2>
          <span className="ml-auto text-xs text-muted-foreground">{members.length} miembro{members.length !== 1 ? 's' : ''}</span>
        </div>

        {members.length > 0 ? (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {(m.name || m.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {m.name && <p className="text-sm font-medium text-foreground leading-none">{m.name}</p>}
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{m.email}</p>
                </div>
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemove(m.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No hay miembros aún.</p>
        )}

        {/* Add member */}
        <div className="flex gap-2 pt-1">
          <Input
            type="email"
            placeholder="Email del usuario..."
            value={addEmail}
            onChange={e => setAddEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            className="flex-1"
          />
          <select
            value={addRole}
            onChange={e => setAddRole(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAdd}
            disabled={adding}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Brand access summary */}
      {Object.keys(brandsByUser).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Accesos por marca</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Los accesos específicos por marca se gestionan desde la configuración de cada marca.
          </p>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {Object.values(brandsByUser).map(u => (
              <div key={u.email} className="px-4 py-3 bg-card">
                <p className="text-sm font-medium text-foreground">{u.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {u.brands.map(b => (
                    <span
                      key={b.name}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground/70"
                    >
                      {b.name}
                      <span className="text-muted-foreground">·</span>
                      {BRAND_ROLE_LABELS[b.role] ?? b.role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role reference */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-card-foreground">Referencia de roles</h2>
        </div>
        <div className="space-y-2">
          {[
            { role: 'Administrador', desc: 'Acceso total — gestiona miembros, marcas, planes y aprueba todo' },
            { role: 'Product Owner', desc: 'Crea y edita marcas, genera planes de contenido, aprueba ideas y producción' },
            { role: 'Content', desc: 'Genera artes y sube assets a los planes asignados' },
          ].map(r => (
            <div key={r.role} className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">{r.role}</Badge>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
