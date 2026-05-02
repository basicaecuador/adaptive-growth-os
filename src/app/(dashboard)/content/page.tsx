'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Sparkles, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useOrganizations } from '@/hooks/use-organizations'
import { useBrands } from '@/hooks/use-brands'
import { useContent, useGenerateContent } from '@/hooks/use-content'
import { toast } from 'sonner'

const PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok']
const TYPES = ['post', 'story', 'reel', 'carousel', 'caption']

const STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
  published: 'default',
}

export default function ContentPage() {
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [platform, setPlatform] = useState('')
  const [type, setType] = useState('')
  const [topic, setTopic] = useState('')

  const { data: orgs } = useOrganizations()
  const activeOrgId = selectedOrgId || orgs?.[0]?.id || ''
  const { data: brands } = useBrands(activeOrgId)
  const activeBrandId = selectedBrandId || brands?.[0]?.id || ''
  const { data: items, isLoading } = useContent(activeBrandId)
  const { mutateAsync: generate, isPending } = useGenerateContent()

  async function handleGenerate() {
    if (!activeBrandId || !platform || !type || !topic.trim()) {
      toast.error('Completa todos los campos')
      return
    }
    try {
      await generate({ brandId: activeBrandId, platform, type, topic })
      toast.success('Contenido generado')
      setTopic('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contenido</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Genera y gestiona contenido con IA
        </p>
      </div>

      {/* Selectors */}
      <div className="mb-6 flex flex-wrap gap-3">
        {orgs && orgs.length > 1 && (
          <Select value={activeOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Organización" />
            </SelectTrigger>
            <SelectContent>
              {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {brands && brands.length > 0 && (
          <Select value={activeBrandId} onValueChange={setSelectedBrandId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {!activeBrandId ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Crea una organización y marca primero
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Generate form */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
              <Sparkles className="h-4 w-4" />
              Generar con IA
            </h2>
            <div className="space-y-4">
              <div>
                <Label>Plataforma</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tema</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Ej: lanzamiento de producto, tips..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isPending ? 'Generando...' : 'Generar contenido'}
              </Button>
            </div>
          </div>

          {/* Content list */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              Contenido generado
            </h2>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Cargando...</div>
            ) : items && items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    {item.imageUrl && (
                      <div className="relative h-48 w-full bg-muted">
                        <Image
                          src={item.imageUrl}
                          alt="Imagen generada"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{item.platform}</Badge>
                          <Badge variant="outline" className="capitalize">{item.type}</Badge>
                        </div>
                        <Badge variant={STATUS_COLORS[item.status] as 'default' | 'secondary' | 'outline' | 'destructive'} className="capitalize">
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {item.notes && (
                        <p className="mb-2 text-xs text-muted-foreground">Tema: {item.notes}</p>
                      )}
                      <p className="text-sm text-card-foreground whitespace-pre-wrap line-clamp-4">
                        {item.body}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString('es')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Usa el formulario para generar tu primer contenido
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
