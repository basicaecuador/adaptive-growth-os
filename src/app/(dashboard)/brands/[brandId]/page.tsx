'use client'

import { use, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, Plus, Type, X, CalendarDays, Sparkles, Check, Package, Users, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useBrandDetail, useInvalidateBrandDetail } from '@/hooks/use-brand-setup'
import { useBrandMembers, useAddBrandMember, useUpdateBrandMemberRole, useRemoveBrandMember } from '@/hooks/use-brand-members'
import type { UserRole } from '@/types/domain'
import { ROLE_LABELS } from '@/types/domain'
import { toast } from 'sonner'

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrador', description: 'Gestiona permisos y tiene acceso total' },
  { value: 'product_owner', label: 'Product Owner', description: 'Crea marcas, planes y aprueba contenido' },
  { value: 'content', label: 'Content', description: 'Genera artes y sube assets' },
]

interface Props {
  params: Promise<{ brandId: string }>
}

const TONO_PRESETS = ['Profesional', 'Conversacional', 'Motivador', 'Informativo', 'Divertido', 'Formal', 'Empático', 'Directo', 'Cercano', 'Experto', 'Audaz', 'Inspirador']

const REDES_PRESETS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'X (Twitter)', 'WhatsApp', 'Google Ads', 'Meta Ads', 'Email']

function PresetChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground'
      }`}
    >
      {active && <Check className="h-3 w-3" />}
      {label}
    </button>
  )
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim()
    if (val && !values.includes(val)) onChange([...values, val])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map(v => (
            <Badge key={v} variant="secondary" className="gap-1.5 pr-1">
              {v}
              <button onClick={() => onChange(values.filter(x => x !== v))} className="rounded-full hover:bg-muted">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BrandSetupPage({ params }: Props) {
  const { brandId } = use(params)
  const { data: brand, isLoading } = useBrandDetail(brandId)
  const invalidateBrand = useInvalidateBrandDetail(brandId)

  const [descripcion, setDescripcion] = useState('')
  const [conceptoComunicacional, setConceptoComunicacional] = useState('')
  const [valueProposition, setValueProposition] = useState('')
  const [tonoEstilo, setTonoEstilo] = useState('')
  const [puntosClave, setPuntosClave] = useState<string[]>([])
  const [mandatoriosGenerales, setMandatoriosGenerales] = useState<string[]>([])
  const [redesDisponibles, setRedesDisponibles] = useState<string[]>([])
  const [competidores, setCompetidores] = useState<string[]>([])
  const [fechasImportantes, setFechasImportantes] = useState<string[]>([])
  const [monthlyPiecesLimit, setMonthlyPiecesLimit] = useState<number | ''>('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [fontUrl, setFontUrl] = useState<string | null>(null)
  const [fontName, setFontName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFont, setUploadingFont] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState<UserRole>('product_owner')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)

  const { data: members = [] } = useBrandMembers(brandId)
  const addMember = useAddBrandMember(brandId)
  const updateMemberRole = useUpdateBrandMemberRole(brandId)
  const removeMember = useRemoveBrandMember(brandId)

  async function handleAddMember() {
    const email = memberEmail.trim()
    if (!email) return
    try {
      await addMember.mutateAsync({ email, role: memberRole })
      setMemberEmail('')
      toast.success('Miembro agregado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agregar miembro')
    }
  }

  async function handleRoleChange(memberId: string, role: UserRole) {
    try {
      await updateMemberRole.mutateAsync({ memberId, role })
      toast.success('Rol actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar rol')
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await removeMember.mutateAsync(memberId)
      toast.success('Miembro eliminado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar miembro')
    }
  }

  useEffect(() => {
    if (!brand) return
    setDescripcion(brand.descripcion ?? '')
    setConceptoComunicacional(brand.conceptoComunicacional ?? '')
    setValueProposition(brand.valueProposition ?? '')
    setTonoEstilo(brand.tonoEstilo ?? '')
    setPuntosClave(brand.puntosClave ?? [])
    setMandatoriosGenerales(brand.mandatoriosGenerales ?? [])
    setRedesDisponibles(brand.redesDisponibles ?? [])
    setCompetidores(brand.competidores ?? [])
    setFechasImportantes(brand.fechasImportantes ?? [])
    setMonthlyPiecesLimit(brand.monthlyPiecesLimit ?? '')
    setLogoUrl(brand.logoUrl ?? null)
    setFontUrl(brand.fontUrl ?? null)
    setFontName(brand.fontUrl ? (brand.fontUrl.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '') : '')
    setPrimaryColor(brand.primaryColor ?? '#6366f1')
  }, [brand])

  const completionFields = [
    !!descripcion.trim(),
    !!conceptoComunicacional.trim(),
    !!valueProposition.trim(),
    !!tonoEstilo.trim(),
    puntosClave.length > 0,
    redesDisponibles.length > 0,
    !!logoUrl,
  ]
  const completionCount = completionFields.filter(Boolean).length
  const completionTotal = completionFields.length

  function getActivePresets(value: string) {
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }

  function togglePreset(current: string, preset: string, setter: (v: string) => void) {
    const parts = getActivePresets(current)
    const idx = parts.findIndex(p => p.toLowerCase() === preset.toLowerCase())
    if (idx >= 0) {
      setter(parts.filter((_, i) => i !== idx).join(', '))
    } else {
      setter([...parts, preset].join(', '))
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const form = new FormData()
      form.append('logo', file)
      const res = await fetch(`/api/brands/${brandId}/logo`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Error al subir logo')
      const { data } = await res.json()
      setLogoUrl(data.logoUrl)
      invalidateBrand()
      toast.success('Logo actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFont(true)
    try {
      const form = new FormData()
      form.append('font', file)
      const res = await fetch(`/api/brands/${brandId}/font`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Error al subir fuente')
      const { data } = await res.json()
      setFontUrl(data.fontUrl)
      setFontName(file.name.replace(/\.[^.]+$/, ''))
      invalidateBrand()
      toast.success('Tipografía actualizada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setUploadingFont(false)
      if (fontInputRef.current) fontInputRef.current.value = ''
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          conceptoComunicacional,
          valueProposition,
          tonoEstilo,
          puntosClave,
          mandatoriosGenerales,
          redesDisponibles,
          competidores,
          fechasImportantes,
          primaryColor,
          monthlyPiecesLimit: monthlyPiecesLimit === '' ? undefined : monthlyPiecesLimit,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      invalidateBrand()
      toast.success('Configuración guardada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl space-y-5">
        <div className="h-5 w-28 bg-muted rounded animate-pulse" />
        <div className="h-28 bg-muted rounded-2xl animate-pulse" />
        <div className="h-52 bg-muted rounded-xl animate-pulse" />
        <div className="h-44 bg-muted rounded-xl animate-pulse" />
        <div className="h-36 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  const brandInitials = brand?.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  const colorAlpha = `${primaryColor}18`

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/brands"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a marcas
      </Link>

      {/* Brand header */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8">
        <div className="h-1.5" style={{ backgroundColor: primaryColor }} />
        <div className="p-6">
          <div className="flex items-center gap-4">
            {/* Logo upload zone */}
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              title={logoUrl ? 'Cambiar logo' : 'Subir logo'}
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border overflow-hidden hover:border-foreground/30 transition-colors group"
              style={{ backgroundColor: colorAlpha }}
            >
              {logoUrl ? (
                <>
                  <Image src={logoUrl} alt="Logo" fill className="object-contain p-1.5" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <span className="text-[10px] text-white font-semibold">Cambiar</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-lg font-bold" style={{ color: primaryColor }}>{brandInitials}</span>
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {uploadingLogo ? '...' : 'Logo'}
                  </span>
                </div>
              )}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

            {/* Name + completion */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">{brand?.name ?? '—'}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{brand?.slug}</p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(completionCount / completionTotal) * 100}%`, backgroundColor: primaryColor }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {completionCount} de {completionTotal} campos
                </span>
              </div>
            </div>

            {/* Plans link */}
            <Link
              href={`/brands/${brandId}/plans`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Planes
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-5">

        {/* Identidad de marca */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">Identidad de marca</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-400">
              <Sparkles className="h-3 w-3" />
              Mayor impacto en IA
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción de la marca</Label>
            <Textarea
              id="descripcion"
              placeholder="¿Qué es esta marca? ¿A qué se dedica? Descríbela en 2-3 oraciones claras."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto comunicacional</Label>
            <Textarea
              id="concepto"
              placeholder="El posicionamiento central que debe atravesar toda la comunicación. Ej: 'La marca que convierte el esfuerzo en resultados reales'."
              value={conceptoComunicacional}
              onChange={e => setConceptoComunicacional(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Propuesta de valor</Label>
            <Textarea
              id="value"
              placeholder="¿Qué problema resuelve, para quién, y cómo lo hace diferente a la competencia?"
              value={valueProposition}
              onChange={e => setValueProposition(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Comunicación */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-card-foreground">Comunicación</h2>

          <div className="space-y-3">
            <Label htmlFor="tono">Tono y estilo de comunicación</Label>
            <Input
              id="tono"
              placeholder="Ej: Profesional, cercano, directo"
              value={tonoEstilo}
              onChange={e => setTonoEstilo(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {TONO_PRESETS.map(preset => (
                <PresetChip
                  key={preset}
                  label={preset}
                  active={getActivePresets(tonoEstilo).some(p => p.toLowerCase() === preset.toLowerCase())}
                  onClick={() => togglePreset(tonoEstilo, preset, setTonoEstilo)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Puntos clave de comunicación</Label>
            <p className="text-xs text-muted-foreground">Los mensajes o argumentos que siempre deben estar presentes.</p>
            <TagInput
              values={puntosClave}
              onChange={setPuntosClave}
              placeholder="Agregar punto clave..."
            />
          </div>

          <div className="space-y-2">
            <Label>Mandatorios generales de comunicación</Label>
            <p className="text-xs text-muted-foreground">Elementos que DEBEN aparecer en toda comunicación (disclaimers, claims, hashtags, etc.).</p>
            <TagInput
              values={mandatoriosGenerales}
              onChange={setMandatoriosGenerales}
              placeholder="Agregar mandatorio..."
            />
          </div>
        </div>

        {/* Canales y mercado */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-card-foreground">Canales y mercado</h2>

          <div className="space-y-3">
            <Label>Redes o canales disponibles</Label>
            <p className="text-xs text-muted-foreground">Los canales activos donde esta marca publica o pauta.</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {REDES_PRESETS.map(red => (
                <PresetChip
                  key={red}
                  label={red}
                  active={redesDisponibles.includes(red)}
                  onClick={() =>
                    redesDisponibles.includes(red)
                      ? setRedesDisponibles(prev => prev.filter(r => r !== red))
                      : setRedesDisponibles(prev => [...prev, red])
                  }
                />
              ))}
            </div>
            <TagInput
              values={redesDisponibles.filter(r => !REDES_PRESETS.includes(r))}
              onChange={extras => setRedesDisponibles([...redesDisponibles.filter(r => REDES_PRESETS.includes(r)), ...extras])}
              placeholder="Otro canal..."
            />
          </div>

          <div className="space-y-2">
            <Label>Competidores</Label>
            <p className="text-xs text-muted-foreground">Marcas o productos contra quienes compite directamente.</p>
            <TagInput
              values={competidores}
              onChange={setCompetidores}
              placeholder="Agregar competidor..."
            />
          </div>

          <div className="space-y-2">
            <Label>Fechas importantes</Label>
            <p className="text-xs text-muted-foreground">Fechas clave propias de la marca: aniversario, temporadas, lanzamientos recurrentes.</p>
            <TagInput
              values={fechasImportantes}
              onChange={setFechasImportantes}
              placeholder="Ej: 15 mar — Aniversario de la marca"
            />
          </div>
        </div>

        {/* Plan mensual contratado */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-card-foreground">Plan mensual contratado</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Define el número máximo de piezas incluidas en el plan mensual del cliente. El sistema alertará si se requieren piezas adicionales.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              id="monthlyPiecesLimit"
              type="number"
              min={1}
              max={500}
              placeholder="Ej: 12"
              value={monthlyPiecesLimit}
              onChange={e => setMonthlyPiecesLimit(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">piezas / mes</span>
            {monthlyPiecesLimit !== '' && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
                Límite: {monthlyPiecesLimit} piezas mensuales
              </span>
            )}
          </div>
        </div>

        {/* Visual identity */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-card-foreground">Identidad visual</h2>

          <div className="space-y-2">
            <Label>Color principal</Label>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer shrink-0">
                <div
                  className="h-10 w-10 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
              <Input
                value={primaryColor}
                onChange={e => {
                  const val = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setPrimaryColor(val)
                }}
                className="font-mono text-sm w-28"
                maxLength={7}
                placeholder="#000000"
              />
              <p className="text-xs text-muted-foreground">Define el acento visual de tus planes</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipografía de marca</Label>
            <div
              onClick={() => fontInputRef.current?.click()}
              className="flex h-14 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-4 hover:border-ring hover:bg-muted/40 transition-colors"
            >
              <Type className="h-4 w-4 text-muted-foreground shrink-0" />
              {fontUrl ? (
                <div>
                  <p className="text-sm font-medium text-foreground leading-none">{fontName || 'Fuente cargada'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Clic para cambiar</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {uploadingFont ? 'Subiendo...' : 'Subir fuente — .ttf, .otf, .woff'}
                </p>
              )}
            </div>
            <input
              ref={fontInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
              onChange={handleFontUpload}
            />
          </div>
        </div>

        {/* Miembros y roles */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-card-foreground">Miembros y roles</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Asigna acceso a esta marca por persona y rol.
            </p>
          </div>

          {/* Role legend */}
          <div className="grid gap-2">
            {ROLE_OPTIONS.map(r => (
              <div key={r.value} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-5 min-w-[110px] items-center justify-center rounded-full bg-muted px-2.5 text-[11px] font-semibold text-foreground/70">
                  {r.label}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">{r.description}</span>
              </div>
            ))}
          </div>

          {/* Current members */}
          {members.length > 0 && (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.email}</p>
                  </div>
                  <select
                    value={m.role}
                    onChange={e => handleRoleChange(m.id, e.target.value as UserRole)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add member form */}
          <div className="flex gap-2">
            <Input
              placeholder="Email del usuario..."
              type="email"
              value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember() } }}
              className="flex-1"
            />
            <select
              value={memberRole}
              onChange={e => setMemberRole(e.target.value as UserRole)}
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
              onClick={handleAddMember}
              disabled={addMember.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {members.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Aún no hay miembros asignados a esta marca.
            </p>
          )}
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
          {isSaving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  )
}
