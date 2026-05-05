'use client'

import { use, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, Plus, Type, X, CalendarDays, Sparkles, Check, Package } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useBrandDetail, useInvalidateBrandDetail } from '@/hooks/use-brand-setup'
import { toast } from 'sonner'

interface Props {
  params: Promise<{ brandId: string }>
}

const VOICE_PRESETS = ['Cercana', 'Experta', 'Innovadora', 'Directa', 'Inspiradora', 'Educativa', 'Audaz', 'Empática']
const TONE_PRESETS = ['Profesional', 'Conversacional', 'Motivador', 'Informativo', 'Divertido', 'Formal', 'Empático', 'Urgente']
const PILLAR_SUGGESTIONS = ['Educación', 'Tendencias', 'Casos de éxito', 'Detrás de escena', 'Producto', 'Comunidad', 'Inspiración', 'Tips prácticos']

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

export default function BrandSetupPage({ params }: Props) {
  const { brandId } = use(params)
  const { data: brand, isLoading } = useBrandDetail(brandId)
  const invalidateBrand = useInvalidateBrandDetail(brandId)

  const [voice, setVoice] = useState('')
  const [tone, setTone] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [valueProposition, setValueProposition] = useState('')
  const [contentPillars, setContentPillars] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [monthlyPiecesLimit, setMonthlyPiecesLimit] = useState<number | ''>('')
  const [pillarInput, setPillarInput] = useState('')
  const [restrictionInput, setRestrictionInput] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [fontUrl, setFontUrl] = useState<string | null>(null)
  const [fontName, setFontName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFont, setUploadingFont] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!brand) return
    setVoice(brand.voice ?? '')
    setTone(brand.tone ?? '')
    setTargetAudience(brand.targetAudience ?? '')
    setValueProposition(brand.valueProposition ?? '')
    setContentPillars(brand.contentPillars ?? [])
    setRestrictions(brand.restrictions ?? [])
    setMonthlyPiecesLimit(brand.monthlyPiecesLimit ?? '')
    setLogoUrl(brand.logoUrl ?? null)
    setFontUrl(brand.fontUrl ?? null)
    setFontName(brand.fontUrl ? (brand.fontUrl.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '') : '')
    setPrimaryColor(brand.primaryColor ?? '#6366f1')
  }, [brand])

  const completionFields = [
    !!voice.trim(),
    !!tone.trim(),
    !!targetAudience.trim(),
    !!valueProposition.trim(),
    contentPillars.length > 0,
    restrictions.length > 0,
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

  function addPillar() {
    const val = pillarInput.trim()
    if (val && !contentPillars.includes(val)) setContentPillars(prev => [...prev, val])
    setPillarInput('')
  }

  function addRestriction() {
    const val = restrictionInput.trim()
    if (val && !restrictions.includes(val)) setRestrictions(prev => [...prev, val])
    setRestrictionInput('')
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice, tone, targetAudience, valueProposition, contentPillars, restrictions, primaryColor, monthlyPiecesLimit: monthlyPiecesLimit === '' ? undefined : monthlyPiecesLimit }),
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

        {/* Strategy — highest AI impact */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">Estrategia de marca</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-400">
              <Sparkles className="h-3 w-3" />
              Mayor impacto en IA
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Audiencia objetivo</Label>
            <Textarea
              id="audience"
              placeholder="Ej: Emprendedores latinoamericanos de 25-40 años que buscan escalar su negocio digital. Con conocimiento básico de marketing pero sin equipo técnico."
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Propuesta de valor</Label>
            <Textarea
              id="value"
              placeholder="¿Qué problema resuelve esta marca, para quién, y cómo lo hace diferente a la competencia?"
              value={valueProposition}
              onChange={e => setValueProposition(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Voice & tone with presets */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-card-foreground">Voz y tono</h2>

          <div className="space-y-3">
            <Label htmlFor="voice">Voz de marca</Label>
            <Input
              id="voice"
              placeholder="Ej: cercana, experta, innovadora"
              value={voice}
              onChange={e => setVoice(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {VOICE_PRESETS.map(preset => (
                <PresetChip
                  key={preset}
                  label={preset}
                  active={getActivePresets(voice).some(p => p.toLowerCase() === preset.toLowerCase())}
                  onClick={() => togglePreset(voice, preset, setVoice)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="tone">Tono</Label>
            <Input
              id="tone"
              placeholder="Ej: profesional pero amigable, directo, inspirador"
              value={tone}
              onChange={e => setTone(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {TONE_PRESETS.map(preset => (
                <PresetChip
                  key={preset}
                  label={preset}
                  active={getActivePresets(tone).some(p => p.toLowerCase() === preset.toLowerCase())}
                  onClick={() => togglePreset(tone, preset, setTone)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content pillars */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-card-foreground">Pilares de contenido</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Los grandes temas sobre los que esta marca comunica.</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Agregar pilar..."
              value={pillarInput}
              onChange={e => setPillarInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPillar() } }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addPillar}><Plus className="h-4 w-4" /></Button>
          </div>
          {contentPillars.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contentPillars.map(p => (
                <Badge key={p} variant="secondary" className="gap-1.5 pr-1">
                  {p}
                  <button onClick={() => setContentPillars(prev => prev.filter(x => x !== p))} className="rounded-full hover:bg-muted">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">Sugerencias:</p>
              <div className="flex flex-wrap gap-1.5">
                {PILLAR_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setContentPillars(prev => prev.includes(s) ? prev : [...prev, s])}
                    className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Restrictions */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-card-foreground">Restricciones</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Temas, palabras o estilos que la marca debe evitar.</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Agregar restricción..."
              value={restrictionInput}
              onChange={e => setRestrictionInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRestriction() } }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addRestriction}><Plus className="h-4 w-4" /></Button>
          </div>
          {restrictions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {restrictions.map(r => (
                <Badge key={r} variant="secondary" className="gap-1.5 pr-1">
                  {r}
                  <button onClick={() => setRestrictions(prev => prev.filter(x => x !== r))} className="rounded-full hover:bg-muted">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Plan mensual contratado */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Plan mensual contratado</h2>
          </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
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

        <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
          {isSaving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  )
}
