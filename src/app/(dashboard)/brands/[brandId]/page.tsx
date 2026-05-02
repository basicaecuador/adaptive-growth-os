'use client'

import { use, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, Plus, Type, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useBrandDetail, useUpdateBrandSetup, useInvalidateBrandDetail } from '@/hooks/use-brand-setup'
import { toast } from 'sonner'

interface Props {
  params: Promise<{ brandId: string }>
}

export default function BrandSetupPage({ params }: Props) {
  const { brandId } = use(params)
  const { data: brand, isLoading } = useBrandDetail(brandId)
  const { mutateAsync, isPending } = useUpdateBrandSetup(brandId)
  const invalidateBrand = useInvalidateBrandDetail(brandId)

  const [voice, setVoice] = useState('')
  const [tone, setTone] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [valueProposition, setValueProposition] = useState('')
  const [contentPillars, setContentPillars] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [pillarInput, setPillarInput] = useState('')
  const [restrictionInput, setRestrictionInput] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [fontUrl, setFontUrl] = useState<string | null>(null)
  const [fontName, setFontName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#000000')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFont, setUploadingFont] = useState(false)
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
    setLogoUrl(brand.logoUrl ?? null)
    setFontUrl(brand.fontUrl ?? null)
    setFontName(brand.fontUrl ? (brand.fontUrl.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '') : '')
    setPrimaryColor(brand.primaryColor ?? '#000000')
  }, [brand])

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
    try {
      await mutateAsync({ voice, tone, targetAudience, valueProposition, contentPillars, restrictions })
      // Save primary color separately
      await fetch(`/api/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor }),
      })
      toast.success('Configuración guardada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Cargando...</div>

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/brands"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a marcas
      </Link>

      <div className="flex items-center gap-4 mb-2">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-muted overflow-hidden">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo" fill className="object-contain" />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {brand?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{brand?.name ?? '—'}</h1>
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {uploadingLogo ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
          </button>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </div>

      <p className="mb-8 text-sm text-muted-foreground">
        Configura la identidad visual y de voz de esta marca.
      </p>

      <div className="space-y-6">

        {/* Visual identity */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-card-foreground">Identidad visual</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Typography */}
            <div className="space-y-2">
              <Label>Tipografía</Label>
              <div
                onClick={() => fontInputRef.current?.click()}
                className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border hover:border-ring hover:bg-muted/50 transition-colors"
              >
                {fontUrl ? (
                  <>
                    <Type className="h-5 w-5 text-foreground" />
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                      {fontName || 'Fuente cargada'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Clic para cambiar</span>
                  </>
                ) : (
                  <>
                    <Type className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {uploadingFont ? 'Subiendo...' : 'Subir fuente (.ttf, .otf)'}
                    </span>
                  </>
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

            {/* Primary color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color principal</Label>
              <div className="flex items-center gap-3">
                <input
                  id="color"
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="h-20 w-full cursor-pointer rounded-lg border border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">{primaryColor}</p>
            </div>
          </div>
        </div>

        {/* Voice & tone */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-card-foreground">Voz y tono</h2>
          <div className="space-y-2">
            <Label htmlFor="voice">Voz de marca</Label>
            <Input id="voice" placeholder="Ej: cercana, experta, innovadora" value={voice} onChange={e => setVoice(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">Tono</Label>
            <Input id="tone" placeholder="Ej: profesional pero amigable, directo, inspirador" value={tone} onChange={e => setTone(e.target.value)} />
          </div>
        </div>

        {/* Audience */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-card-foreground">Audiencia</h2>
          <div className="space-y-2">
            <Label htmlFor="audience">Audiencia objetivo</Label>
            <Input id="audience" placeholder="Ej: emprendedores latinoamericanos de 25-40 años" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Propuesta de valor</Label>
            <Textarea id="value" placeholder="¿Qué problema resuelve la marca y cómo lo hace de forma única?" rows={3} value={valueProposition} onChange={e => setValueProposition(e.target.value)} />
          </div>
        </div>

        {/* Content pillars */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-card-foreground">Pilares de contenido</h2>
          <p className="text-xs text-muted-foreground">Los temas principales sobre los que la marca debe comunicar.</p>
          <div className="flex gap-2">
            <Input placeholder="Agregar pilar..." value={pillarInput} onChange={e => setPillarInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPillar() } }} />
            <Button type="button" variant="outline" size="icon" onClick={addPillar}><Plus className="h-4 w-4" /></Button>
          </div>
          {contentPillars.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {contentPillars.map(p => (
                <Badge key={p} variant="secondary" className="gap-1.5 pr-1">
                  {p}
                  <button onClick={() => setContentPillars(prev => prev.filter(x => x !== p))} className="rounded-full hover:bg-muted"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Restrictions */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-card-foreground">Restricciones</h2>
          <p className="text-xs text-muted-foreground">Temas, palabras o estilos que la marca debe evitar.</p>
          <div className="flex gap-2">
            <Input placeholder="Agregar restricción..." value={restrictionInput} onChange={e => setRestrictionInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRestriction() } }} />
            <Button type="button" variant="outline" size="icon" onClick={addRestriction}><Plus className="h-4 w-4" /></Button>
          </div>
          {restrictions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {restrictions.map(r => (
                <Badge key={r} variant="secondary" className="gap-1.5 pr-1">
                  {r}
                  <button onClick={() => setRestrictions(prev => prev.filter(x => x !== r))} className="rounded-full hover:bg-muted"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  )
}
