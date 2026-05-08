'use client'

import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check, X, Pencil, ChevronRight, ChevronLeft, Zap, Heart, BarChart2, RefreshCw, Copy, ExternalLink, Film, Image, Layers, MessageCircle, Share2, Globe, ThumbsUp, Upload, Calendar, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SafeZonePreview } from '@/components/creative/safe-zone-preview'
import { AdobeExpressBtn } from '@/components/creative/adobe-express-btn'
import {
  useContentPlan,
  useGenerateBrief,
  useGeneratePlan,
  useUpdatePlan,
  useUpdatePlanItem,
  useRefineIdea,
  useProducePlan,
  useGenerateImage,
  useGenerateVideo,
  useHiggsfieldStatus,
  useUploadAsset,
  useExpansionRequests,
  useCreateExpansionRequest,
  useReviewExpansionRequest,
} from '@/hooks/use-content-plans'
import { useBrandDetail } from '@/hooks/use-brand-setup'
import { toast } from 'sonner'
import type { ContentPlanItem, FunnelStage, PlanIdea, IdeaType, GeneratedAsset, AdFormat } from '@/types/domain'

interface Props {
  params: Promise<{ brandId: string; planId: string }>
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FUNNEL_COLORS: Record<FunnelStage, string> = {
  awareness: 'bg-purple-100 text-purple-700 border-purple-200',
  consideration: 'bg-blue-100 text-blue-700 border-blue-200',
  conversion: 'bg-green-100 text-green-700 border-green-200',
  retention: 'bg-orange-100 text-orange-700 border-orange-200',
  remarketing: 'bg-pink-100 text-pink-700 border-pink-200',
}

const FUNNEL_LABELS: Record<FunnelStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideración',
  conversion: 'Conversión',
  retention: 'Retención',
  remarketing: 'Remarketing',
}

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const IDEA_CONFIG: Record<IdeaType, { label: string; icon: React.ReactNode; color: string; border: string; bg: string; badge: string }> = {
  disruptiva: {
    label: 'Disruptiva',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-rose-600',
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    badge: 'bg-rose-100 text-rose-700',
  },
  aspiracional: {
    label: 'Aspiracional',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-violet-600',
    border: 'border-violet-200',
    bg: 'bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
  },
  racional: {
    label: 'Racional',
    icon: <BarChart2 className="h-4 w-4" />,
    color: 'text-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
}

const COLUMNS: { key: keyof ContentPlanItem; label: string; width: string }[] = [
  { key: 'temporality', label: 'Fecha / Temporalidad', width: 'w-36' },
  { key: 'funnelStage', label: 'Etapa funnel', width: 'w-32' },
  { key: 'objective', label: 'Objetivo', width: 'w-40' },
  { key: 'idea', label: 'Idea de contenido', width: 'w-48' },
  { key: 'format', label: 'Formato', width: 'w-24' },
  { key: 'channel', label: 'Canal', width: 'w-24' },
  { key: 'kpi', label: 'KPI', width: 'w-36' },
  { key: 'mainMessage', label: 'Mensaje principal', width: 'w-48' },
  { key: 'cta', label: 'CTA', width: 'w-32' },
  { key: 'observations', label: 'Observaciones', width: 'w-48' },
]

const CHANNELS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Google', 'Email', 'WhatsApp']

const CHANNEL_INFO: Record<string, { description: string }> = {
  Instagram: { description: 'Mayor alcance orgánico · Reels + Stories de alto impacto' },
  Facebook: { description: 'Comunidad establecida · Grupos y alcance eficiente' },
  TikTok: { description: 'Crecimiento acelerado · Audiencia 18-35 años' },
  LinkedIn: { description: 'Autoridad profesional · Audiencias B2B' },
  Google: { description: 'Intención activa de compra · Search Ads + Display' },
  Email: { description: 'Alta conversión · Sin algoritmo, audiencia propia' },
  WhatsApp: { description: 'Cierre de ventas directo · Status y difusión' },
}


const FUNNEL_FOCUS_OPTIONS = [
  { value: 'balanced', label: 'Equilibrado', description: 'Distribución balanceada entre todas las etapas' },
  { value: 'awareness', label: 'Priorizar awareness', description: 'Más alcance y captación de audiencia nueva' },
  { value: 'conversion', label: 'Priorizar conversión', description: 'Enfoque en ventas y generación de leads' },
  { value: 'retention', label: 'Priorizar retención', description: 'Fidelización de clientes actuales' },
]

const VIDEO_FORMATS = ['Reel', 'Historia', 'Video', 'Story']

const AD_FORMATS: Record<AdFormat, { label: string; platforms: string; aspectClass: string; previewClass: string }> = {
  square:    { label: 'Feed 1:1',       platforms: 'Instagram · Facebook · LinkedIn', aspectClass: 'aspect-square',    previewClass: 'max-w-[200px]' },
  story:     { label: 'Story / Reel',   platforms: 'Instagram · TikTok · Facebook',   aspectClass: 'aspect-[9/16]',    previewClass: 'max-w-[120px]' },
  landscape: { label: 'Paisaje 16:9',   platforms: 'Google · YouTube · LinkedIn',     aspectClass: 'aspect-video',     previewClass: 'max-w-[280px]' },
}
const AD_FORMAT_KEYS = Object.keys(AD_FORMATS) as AdFormat[]

const IMAGE_MODELS = [
  { id: 'flux' as const, label: 'Flux 1.1 Pro', desc: 'Mejor calidad' },
  { id: 'gpt-image-1' as const, label: 'gpt-image-1', desc: 'OpenAI' },
  { id: 'dalle3' as const, label: 'DALL-E 3', desc: 'Más rápido' },
]
type ImageModelId = typeof IMAGE_MODELS[number]['id']

const VISUAL_STYLES = [
  { id: 'fotorealista' as const, label: 'Fotorealista', desc: 'Foto comercial', modifier: 'ultra-realistic commercial photography, natural daylight, sharp focus, Canon DSLR quality' },
  { id: 'cinematico' as const, label: 'Cine', desc: 'Luz dramática', modifier: 'cinematic film photography, dramatic moody lighting, shallow depth of field, movie still' },
  { id: 'ilustracion' as const, label: 'Ilustración', desc: 'Digital art', modifier: 'professional digital illustration, bold vibrant colors, editorial graphic style' },
  { id: '3d' as const, label: '3D', desc: 'CGI render', modifier: 'photorealistic 3D CGI render, studio product lighting, clean background, octane quality' },
  { id: 'minimalista' as const, label: 'Minimal', desc: 'Clean & simple', modifier: 'minimalist photography, clean light background, product focus, lots of white space' },
]
type VisualStyleId = typeof VISUAL_STYLES[number]['id']

const PAUTA_BY_STAGE: Record<FunnelStage, { objetivo: string; tipo: string; presupuesto: string; plazo: string; tip: string }> = {
  awareness:     { objetivo: 'Reconocimiento de marca / Alcance', tipo: 'CPM — costo por mil impresiones', presupuesto: '$5–$15 USD/día', plazo: '7–14 días', tip: 'Optimiza por frecuencia 3–5x/semana; audiencias amplias de interés' },
  consideration: { objetivo: 'Tráfico al sitio / Interacción',    tipo: 'CPC — costo por clic',              presupuesto: '$8–$20 USD/día', plazo: '7–10 días', tip: 'Audiencias de interés + retargeting suave de visitantes recientes' },
  conversion:    { objetivo: 'Conversiones / Ventas directas',    tipo: 'CPA — costo por acción',            presupuesto: '$15–$40 USD/día', plazo: '5–7 días', tip: 'Activa el píxel con evento de compra; lookalike 2% de compradores' },
  retention:     { objetivo: 'Engagement / Fidelización',         tipo: 'CPE — costo por engagement',        presupuesto: '$3–$10 USD/día', plazo: '14–30 días', tip: 'Segmenta solo clientes activos y suscriptores; excluye prospectos' },
  remarketing:   { objetivo: 'Retargeting / Re-captación',        tipo: 'CPA — costo por acción',            presupuesto: '$10–$25 USD/día', plazo: '7–14 días', tip: 'Audiencia: visitantes últimos 30 días + carrito abandonado' },
}

const SCHEDULE_DAY_BY_STAGE: Record<FunnelStage, string> = {
  awareness:     'Lunes o martes — inicio de semana para mayor alcance orgánico',
  consideration: 'Miércoles o jueves — audiencia más activa y receptiva',
  conversion:    'Viernes o sábado — mayor intención de compra en fin de semana',
  retention:     'Cualquier día — prioriza consistencia sobre timing exacto',
  remarketing:   'Domingo o lunes — alto retorno post fin de semana',
}

function parseSlides(development: string): { label: string; visual: string; text: string }[] {
  const results: { label: string; visual: string; text: string }[] = []
  for (const line of development.split('\n')) {
    const m = line.match(/^(S\d+)[^:]*:\s*(.+?)\s*\|\s*Visual:\s*(.+)$/i)
    if (m) results.push({ label: m[1].toUpperCase(), text: m[2].trim(), visual: m[3].trim() })
  }
  return results
}

function parseScenes(development: string): { label: string; visual: string; voice: string }[] {
  const results: { label: string; visual: string; voice: string }[] = []
  for (const line of development.split('\n')) {
    const m = line.match(/^(ESC\d+)[^:]*:\s*Visual:\s*([^|]+?)(?:\s*\|\s*Voz:\s*(.+))?$/i)
    if (m) results.push({ label: m[1].toUpperCase(), visual: m[2].trim(), voice: (m[3] ?? '').trim() })
  }
  return results
}

function extractVisual(development: string, slides: ReturnType<typeof parseSlides>, segmentIdx: number, isCarousel: boolean): string {
  if (isCarousel) {
    const slide = slides[segmentIdx]
    if (slide?.visual) return slide.visual
  }
  const m = development.match(/VISUAL:\s*([^\n]+)/i)
  if (m?.[1]?.trim()) return m[1].trim()
  return ''
}

function buildDallePrompt(idea: PlanIdea, styleId: VisualStyleId, segmentIdx: number): string {
  const format = idea.contentType ?? 'Post'
  const isCarousel = /carrusel|carousel/i.test(format)
  const isVertical = /historia|story/i.test(format)
  const development = (idea.development ?? '').trim()
  const slides = isCarousel ? parseSlides(development) : []

  const rawVisual = extractVisual(development, slides, segmentIdx, isCarousel)
  // Strip brackets and clean up design-spec language
  const cleanedVisual = rawVisual
    .replace(/^\[|\]$/g, '')
    .replace(/tipografía[^,.\n]*/gi, '')
    .replace(/fondo\s+(azul|blanco|negro|gris|color)[^,.\n]*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const visualSubject = cleanedVisual || idea.hook || ''

  // Auto-detect style: if visual describes illustration/icons/flat, override to illustration
  const isIllustrationContent = /ilustración|flat|íconos|iconos|diseño gráfico|infografía/i.test(visualSubject)
  const effectiveStyleId: VisualStyleId = isIllustrationContent ? 'ilustracion' : styleId
  const style = VISUAL_STYLES.find(s => s.id === effectiveStyleId) ?? VISUAL_STYLES[0]

  const isPhotography = /fotorealista|cinematico|minimalista/.test(effectiveStyleId)

  let composition = ''
  if (isCarousel) {
    const isFirst = segmentIdx === 0
    const isLast = segmentIdx === slides.length - 1
    composition = isFirst
      ? 'Composición de alto impacto, primer plano llamativo que detiene el scroll'
      : isLast
      ? 'Composición limpia con espacio en blanco, sensación de llamada a la acción'
      : 'Composición equilibrada, clara y legible'
  }

  const aspectRatio = isVertical
    ? 'vertical 9:16, sujeto en zona segura central (alejado 15% bordes superior e inferior)'
    : 'cuadrado 1:1, sujeto centrado con espacio para respirar'

  const hasPerson = /person|woman|man|mujer|hombre|persona|people|gente|modelo/i.test(visualSubject)
  const hasHandProps = /holding|sosteniendo|sujetando|hand|mano|phone|celular|tablet|calend|reloj|clock/i.test(visualSubject)

  const parts = [
    `${style.modifier}, colores vibrantes, enfoque nítido perfecto.`,
    hasHandProps
      ? `Sujeto: ${visualSubject.replace(/holding|sosteniendo|sujetando/gi, 'cerca de')}. Persona en pose relajada y natural con manos visibles — sin objetos en las manos.`
      : `Sujeto: ${visualSubject}.`,
    hasPerson && isPhotography ? 'Anatomía humana realista: proporciones correctas, exactamente cinco dedos por mano, expresión genuina. No poses artificiales de stock.' : '',
    isPhotography && !hasPerson ? 'Mood: positivo, aspiracional, auténtico.' : '',
    !isPhotography ? 'Estilo limpio y profesional, colores de marca coherentes.' : '',
    composition ? `Composición: ${composition}.` : '',
    `Formato ${aspectRatio}. Sin texto, sin logos, sin marcas de agua, sin marcos. Espacio limpio para superponer texto.`,
  ].filter(Boolean).join('\n')

  return parts
}

function getFormatIcon(contentType: string) {
  if (VIDEO_FORMATS.some(f => contentType.toLowerCase().includes(f.toLowerCase())))
    return <Film className="h-3 w-3 shrink-0" />
  if (/carrusel|carousel/i.test(contentType))
    return <Layers className="h-3 w-3 shrink-0" />
  return <Image className="h-3 w-3 shrink-0" />
}

function InstagramFeedMockup({ asset, copy }: { asset: GeneratedAsset; copy: string }) {
  const isVideo = asset.model === 'upload-video'
  return (
    <div className="rounded-2xl border-[3px] border-gray-800 bg-white overflow-hidden shadow-xl w-[260px] shrink-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-px">
          <div className="h-full w-full rounded-full bg-gray-200" />
        </div>
        <span className="text-[11px] font-semibold text-gray-900 flex-1">tu_marca</span>
        <span className="text-gray-400 text-xs tracking-widest">•••</span>
      </div>
      <div className="aspect-square w-full bg-gray-100">
        {isVideo
          ? <video src={asset.url} className="h-full w-full object-cover" muted loop />
          : <img src={asset.url} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-gray-800" />
          <MessageCircle className="h-5 w-5 text-gray-800" />
          <Share2 className="h-5 w-5 text-gray-800" />
          <Bookmark className="h-5 w-5 text-gray-800 ml-auto" />
        </div>
        <p className="text-[10px] font-semibold text-gray-900">1,240 Me gusta</p>
        <p className="text-[10px] text-gray-700 line-clamp-3 leading-relaxed">
          <span className="font-semibold">tu_marca </span>{copy.slice(0, 120)}
        </p>
      </div>
    </div>
  )
}

function VerticalMockup({ asset, copy, platform = 'Instagram' }: { asset: GeneratedAsset; copy: string; platform?: string }) {
  const isVideo = asset.model === 'upload-video'
  return (
    <div className="rounded-2xl border-[3px] border-gray-800 bg-black overflow-hidden shadow-xl w-[150px] shrink-0" style={{ aspectRatio: '9/19.5' }}>
      <div className="relative h-full w-full">
        {isVideo
          ? <video src={asset.url} className="absolute inset-0 h-full w-full object-cover" muted loop />
          : <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 flex flex-col justify-between p-2">
          <div>
            <div className="flex gap-0.5 mb-1.5">
              {[1,2,3].map(i => (
                <div key={i} className={`flex-1 h-0.5 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <div className="h-5 w-5 rounded-full bg-white/30 border border-white/60" />
              <span className="text-white text-[9px] font-semibold drop-shadow">{platform}</span>
            </div>
          </div>
          <div className="rounded-lg bg-black/60 px-2 py-1.5">
            <p className="text-white text-[8px] leading-relaxed line-clamp-3">{copy.slice(0, 80)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FacebookMockup({ asset, copy }: { asset: GeneratedAsset; copy: string }) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white shadow-md w-[280px] shrink-0 overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">M</div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-gray-900">Tu Marca</p>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500">Hace 2 h</span>
            <Globe className="h-2.5 w-2.5 text-gray-400" />
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-700 px-3 pb-2 line-clamp-2 leading-relaxed">{copy.slice(0, 120)}</p>
      <div className={`${asset.format === 'landscape' ? 'aspect-video' : 'aspect-square'} w-full bg-gray-100`}>
        <img src={asset.url} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-200">
        <ThumbsUp className="h-3.5 w-3.5 text-blue-600" />
        <span className="text-[9px] text-blue-600 font-medium mr-2">Me gusta</span>
        <MessageCircle className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[9px] text-gray-500 mr-2">Comentar</span>
        <Share2 className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[9px] text-gray-500">Compartir</span>
      </div>
    </div>
  )
}

function SocialMockup({ asset, channel, copy }: { asset: GeneratedAsset; channel: string; copy: string }) {
  if (/tiktok/i.test(channel)) return <VerticalMockup asset={asset} copy={copy} platform="TikTok" />
  if (asset.format === 'story') return <VerticalMockup asset={asset} copy={copy} platform={/instagram/i.test(channel) ? 'Instagram' : 'Reel'} />
  if (/facebook/i.test(channel)) return <FacebookMockup asset={asset} copy={copy} />
  return <InstagramFeedMockup asset={asset} copy={copy} />
}

function PautaCard({ funnelStage, channel }: { funnelStage: FunnelStage; channel: string | null }) {
  const pauta = PAUTA_BY_STAGE[funnelStage]
  const scheduleDay = SCHEDULE_DAY_BY_STAGE[funnelStage]
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Info para pauta publicitaria</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[9px] text-blue-400 uppercase tracking-wider mb-0.5">Objetivo de campaña</p>
          <p className="text-xs font-medium text-blue-900">{pauta.objetivo}</p>
        </div>
        <div>
          <p className="text-[9px] text-blue-400 uppercase tracking-wider mb-0.5">Tipo de puja</p>
          <p className="text-xs font-medium text-blue-900">{pauta.tipo}</p>
        </div>
        <div>
          <p className="text-[9px] text-blue-400 uppercase tracking-wider mb-0.5">Presupuesto sugerido</p>
          <p className="text-xs font-semibold text-blue-900">{pauta.presupuesto}</p>
        </div>
        <div>
          <p className="text-[9px] text-blue-400 uppercase tracking-wider mb-0.5">Duración</p>
          <p className="text-xs font-medium text-blue-900">{pauta.plazo}</p>
        </div>
      </div>
      <div className="rounded-lg bg-blue-100 px-3 py-2">
        <p className="text-[10px] text-blue-700 leading-relaxed">💡 {pauta.tip}</p>
      </div>
      <div className="flex items-start gap-2">
        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[9px] text-blue-400 uppercase tracking-wider mb-0.5">Publicación recomendada</p>
          <p className="text-xs text-blue-800">{scheduleDay}</p>
        </div>
      </div>
    </div>
  )
}

function CreativeTools({
  idea,
  planId,
  itemId,
  persistedAssets = [],
}: {
  idea: PlanIdea
  planId: string
  itemId: string
  persistedAssets?: GeneratedAsset[]
}) {
  const isVideo = VIDEO_FORMATS.some(f => idea.contentType?.toLowerCase().includes(f.toLowerCase()))
  const isCarousel = /carrusel|carousel/i.test(idea.contentType ?? '')
  const isGoogle = /google/i.test(idea.contentType ?? '')
  const isStatic = !isVideo && !isGoogle

  const defaultFormat: AdFormat = /historia|story/i.test(idea.contentType ?? '') ? 'story' : 'square'

  const [arteTab, setArteTab] = useState<'ia' | 'herramientas' | 'subir'>('ia')
  const [copied, setCopied] = useState(false)
  const [localAssets, setLocalAssets] = useState<GeneratedAsset[]>(persistedAssets)
  const [selectedFormat, setSelectedFormat] = useState<AdFormat>(defaultFormat)
  const [generatingFormats, setGeneratingFormats] = useState<Set<AdFormat>>(new Set())
  const [visualStyle, setVisualStyle] = useState<VisualStyleId>('fotorealista')
  const [generatorModel, setGeneratorModel] = useState<ImageModelId>('gpt-image-1')
  const [segmentIdx, setSegmentIdx] = useState(0)
  const [promptText, setPromptText] = useState('')
  const [uploadFormat, setUploadFormat] = useState<AdFormat>(defaultFormat)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocalAssets(persistedAssets) }, [persistedAssets])

  useEffect(() => {
    if (!isStatic) return
    setPromptText(buildDallePrompt(idea, visualStyle, segmentIdx))
  }, [idea, visualStyle, segmentIdx])

  const { mutateAsync: generateImage } = useGenerateImage(planId)
  const { mutateAsync: generateVideo, isPending: generatingVideo } = useGenerateVideo(planId)
  const { mutateAsync: checkStatus } = useHiggsfieldStatus()
  const { mutateAsync: uploadAsset } = useUploadAsset(planId)

  const [videoJobId, setVideoJobId] = useState<string | null>(null)
  const [videoStatus, setVideoStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoMotion, setVideoMotion] = useState<{ id: string; name: string; reason: string } | null>(null)
  const [videoPromptReady, setVideoPromptReady] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const slides = isCarousel ? parseSlides(idea.development ?? '') : []
  const scenes = isVideo ? parseScenes(idea.development ?? '') : []

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleGenerateFormat(fmt: AdFormat) {
    setGeneratingFormats(prev => new Set(prev).add(fmt))
    try {
      const result = await generateImage({ itemId, prompt: promptText, model: generatorModel, targetFormat: fmt })
      if (result.asset) {
        setLocalAssets(prev => [...prev.filter(a => a.format !== fmt), result.asset])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar imagen')
    } finally {
      setGeneratingFormats(prev => { const next = new Set(prev); next.delete(fmt); return next })
    }
  }

  async function handleGenerateAll() {
    await Promise.allSettled(AD_FORMAT_KEYS.map(fmt => handleGenerateFormat(fmt)))
  }

  function startPolling(jobId: string) {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const result = await checkStatus(jobId)
        if (result.status === 'completed' || result.status === 'succeeded' || result.status === 'done') {
          clearInterval(pollingRef.current!)
          pollingRef.current = null
          if (result.videoUrl) {
            setVideoUrl(result.videoUrl)
            setVideoStatus('done')
          } else {
            setVideoStatus('error')
            toast.error('Video completado pero sin URL. Intenta de nuevo.')
          }
        } else if (result.status === 'failed' || result.status === 'error') {
          clearInterval(pollingRef.current!)
          pollingRef.current = null
          setVideoStatus('error')
          toast.error('La generación de video falló en Higgsfield.')
        }
      } catch {
        // ignore transient polling errors
      }
    }, 6000)
  }

  async function handleRecommendAndPrepare() {
    try {
      const result = await generateVideo({ itemId })
      setVideoPrompt(result.prompt)
      setVideoMotion({ id: result.motionId, name: result.motionName, reason: result.reason })
      setVideoJobId(result.jobId)
      setVideoStatus('pending')
      setVideoPromptReady(true)
      startPolling(result.jobId)
      toast.success(`Generando video con ${result.motionName}...`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar video')
    }
  }

  async function handleRegenerateVideo() {
    if (!videoPrompt || !videoMotion) return
    try {
      const result = await generateVideo({ itemId, prompt: videoPrompt, motionId: videoMotion.id })
      setVideoJobId(result.jobId)
      setVideoStatus('pending')
      setVideoUrl(null)
      startPolling(result.jobId)
      toast.success('Regenerando video...')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al regenerar video')
    }
  }

  async function handleFileUpload() {
    if (!uploadFile) return
    setUploading(true)
    try {
      const result = await uploadAsset({ itemId, file: uploadFile, targetFormat: uploadFormat })
      if (result.asset) {
        setLocalAssets(prev => [...prev.filter(a => a.format !== uploadFormat), result.asset])
        toast.success('Arte subido correctamente')
        setUploadFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir arte')
    } finally {
      setUploading(false)
    }
  }

  function buildExternalPrompts(fmt: AdFormat) {
    const ar = fmt === 'story' ? '9:16' : fmt === 'landscape' ? '16:9' : '1:1'
    const baseLines = promptText.split('\n').filter(Boolean)
    const coreSubject = baseLines[1]?.slice(0, 200) ?? idea.hook.slice(0, 150)
    const styleHint = baseLines[0]?.slice(0, 80) ?? 'professional commercial photography'
    return {
      midjourney: `/imagine ${coreSubject}, ${styleHint}, studio lighting, tack-sharp --ar ${ar} --v 6 --quality 1 --style raw`,
      firefly: `${coreSubject}. ${styleHint}. Soft studio lighting, high resolution, commercial photography quality.`,
      canva: `${idea.hook.slice(0, 100)}. ${coreSubject.slice(0, 100)}. Social media ${fmt === 'story' ? 'story vertical' : fmt === 'landscape' ? 'landscape banner' : 'post'}.`,
    }
  }

  const tabLabels = { ia: 'Generar con IA', herramientas: 'Herramientas externas', subir: 'Subir arte' } as const

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Internal tab bar */}
      <div className="flex border-b border-border bg-muted/20">
        {(['ia', 'herramientas', 'subir'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setArteTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              arteTab === tab
                ? 'border-foreground text-foreground bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tabLabels[tab]}
            {tab === 'subir' && localAssets.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-100 text-[9px] font-bold text-green-700">
                {localAssets.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Generar con IA ── */}
      {arteTab === 'ia' && (
        <div className="p-4 space-y-4">
          {/* Video: Higgsfield */}
          {isVideo && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Generar video con Higgsfield IA
              </p>
              {scenes.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {scenes.map((sc) => (
                    <span key={sc.label} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {sc.label}: {sc.visual.slice(0, 40)}…
                    </span>
                  ))}
                </div>
              )}
              {!videoPromptReady ? (
                <Button onClick={handleRecommendAndPrepare} disabled={generatingVideo} size="sm" className="gap-1.5 bg-violet-700 hover:bg-violet-800 text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingVideo ? 'Claude analizando guion...' : 'Recomendar efecto y generar video'}
                </Button>
              ) : (
                <div className="space-y-3">
                  {videoMotion && (
                    <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">Efecto recomendado</span>
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">{videoMotion.name}</span>
                      </div>
                      {videoMotion.reason && <p className="text-xs text-violet-700 italic">{videoMotion.reason}</p>}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground">Prompt para Higgsfield — edítalo si quieres ajustar</p>
                    <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} rows={6}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y leading-relaxed" />
                  </div>
                  {videoStatus === 'pending' && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-xs text-amber-700 animate-pulse">Higgsfield está generando el video — verificando cada 6 segundos...</p>
                      {videoJobId && <p className="text-[10px] text-amber-500 mt-0.5">Job ID: {videoJobId}</p>}
                    </div>
                  )}
                  {videoStatus === 'done' && videoUrl && (
                    <div className="space-y-2">
                      <video src={videoUrl} controls autoPlay loop className="rounded-xl border border-border w-full max-w-sm shadow-sm" />
                      <div className="flex gap-2 flex-wrap">
                        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <ExternalLink className="h-3 w-3" /> Descargar video
                        </a>
                        <button onClick={handleRegenerateVideo} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <RefreshCw className="h-3 w-3" /> Regenerar
                        </button>
                      </div>
                    </div>
                  )}
                  {videoStatus === 'error' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-center justify-between">
                      <p className="text-xs text-red-600">Falló la generación. Revisa tus créditos en Higgsfield.</p>
                      <button onClick={handleRegenerateVideo} className="text-xs text-red-600 underline">Reintentar</button>
                    </div>
                  )}
                  {videoStatus === 'idle' && (
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={handleRegenerateVideo} disabled={generatingVideo} size="sm" className="gap-1.5 bg-violet-700 hover:bg-violet-800 text-white">
                        <Sparkles className="h-3.5 w-3.5" /> Generar video
                      </Button>
                      <button onClick={() => { setVideoPromptReady(false); setVideoMotion(null); setVideoStatus('idle') }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        ← Volver
                      </button>
                      <button onClick={() => copyText(videoPrompt)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {copied ? 'Copiado' : 'Copiar prompt'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Static: image generation */}
          {isStatic && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Generador</p>
                <div className="flex gap-1.5 flex-wrap">
                  {IMAGE_MODELS.map(m => (
                    <button key={m.id} onClick={() => setGeneratorModel(m.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors ${generatorModel === m.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'}`}>
                      <span className="block text-xs font-medium">{m.label}</span>
                      <span className={`block text-[9px] mt-0.5 ${generatorModel === m.id ? 'opacity-70' : 'opacity-50'}`}>{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Estilo visual</p>
                <div className="flex gap-1.5 flex-wrap">
                  {VISUAL_STYLES.map(style => (
                    <button key={style.id} onClick={() => setVisualStyle(style.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors ${visualStyle === style.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'}`}>
                      <span className="block text-xs font-medium">{style.label}</span>
                      <span className={`block text-[9px] mt-0.5 ${visualStyle === style.id ? 'opacity-70' : 'opacity-50'}`}>{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {isCarousel && slides.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Slide</p>
                  <div className="flex gap-1 flex-wrap">
                    {slides.map((slide, i) => (
                      <button key={slide.label} onClick={() => setSegmentIdx(i)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${segmentIdx === i ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground hover:border-foreground/40'}`}>
                        {slide.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">Prompt de imagen — edítalo si quieres ajustar</p>
                <textarea value={promptText} onChange={e => setPromptText(e.target.value)} rows={5}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y leading-relaxed" />
                <button onClick={() => copyText(promptText)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? 'Copiado ✓' : 'Copiar prompt'}
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground mb-1">Formato del anuncio</p>
                <div className="flex gap-1.5 flex-wrap">
                  {AD_FORMAT_KEYS.map(fmt => {
                    const fmtCfg = AD_FORMATS[fmt]
                    const hasAsset = localAssets.some(a => a.format === fmt)
                    const isGenFmt = generatingFormats.has(fmt)
                    return (
                      <button key={fmt} onClick={() => setSelectedFormat(fmt)}
                        className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors relative ${selectedFormat === fmt ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'}`}>
                        <span className="block text-xs font-medium">{fmtCfg.label}</span>
                        <span className={`block text-[9px] mt-0.5 ${selectedFormat === fmt ? 'opacity-70' : 'opacity-50'}`}>{fmtCfg.platforms}</span>
                        {(hasAsset || isGenFmt) && (
                          <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${isGenFmt ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => handleGenerateFormat(selectedFormat)} disabled={!promptText.trim() || generatingFormats.has(selectedFormat)} size="sm" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {generatingFormats.has(selectedFormat) ? 'Generando...' : `Generar ${AD_FORMATS[selectedFormat].label}`}
                  </Button>
                  <Button onClick={handleGenerateAll} disabled={!promptText.trim() || generatingFormats.size > 0} size="sm" variant="outline" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Generar todos los formatos
                  </Button>
                </div>
                {generatingFormats.size > 0 && (
                  <p className="text-[11px] text-muted-foreground animate-pulse">
                    {generatorModel === 'flux' ? 'Flux generando — ~30s por formato...' : generatorModel === 'gpt-image-1' ? 'gpt-image-1 generando — ~90s por formato...' : 'DALL-E 3 generando — ~20s por formato...'}
                  </p>
                )}
              </div>
              {localAssets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Artes generadas — {localAssets.length} formato{localAssets.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {AD_FORMAT_KEYS.map(fmt => {
                      const asset = localAssets.find(a => a.format === fmt)
                      const fmtCfg = AD_FORMATS[fmt]
                      const isGenFmt = generatingFormats.has(fmt)
                      return (
                        <div key={fmt} className="space-y-1.5">
                          <p className="text-[10px] font-medium text-muted-foreground">{fmtCfg.label}</p>
                          <div className={`${fmtCfg.aspectClass} ${fmtCfg.previewClass} w-full overflow-hidden rounded-lg border border-border bg-muted`}>
                            {isGenFmt ? (
                              <div className="h-full w-full flex items-center justify-center"><span className="text-[10px] text-muted-foreground animate-pulse">Generando...</span></div>
                            ) : asset ? (
                              <img src={asset.url} alt={asset.label} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center"><span className="text-[10px] text-muted-foreground/40">Sin generar</span></div>
                            )}
                          </div>
                          {asset && (
                            <div className="flex gap-1.5 flex-wrap">
                              <a href={asset.url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                <ExternalLink className="h-2.5 w-2.5" /> Descargar
                              </a>
                              <button onClick={() => handleGenerateFormat(fmt)} disabled={generatingFormats.has(fmt)} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
                                <RefreshCw className="h-2.5 w-2.5" /> Regen.
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {isGoogle && (
            <p className="text-xs text-muted-foreground">Copia el texto del anuncio y créalo en Google Ads Manager.</p>
          )}
        </div>
      )}

      {/* ── TAB: Herramientas externas ── */}
      {arteTab === 'herramientas' && (
        <div className="p-4 space-y-5">
          {/* Guion de referencia */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Guion / guía de referencia</p>
            <div className="rounded-lg bg-muted/60 border border-border px-3 py-3 max-h-52 overflow-y-auto">
              <p className="text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {(idea.development ?? idea.hook ?? '').trim()}
              </p>
            </div>
          </div>

          {/* Safe zone preview */}
          {!isGoogle && <SafeZonePreview format={idea.contentType ?? ''} />}

          {/* Prompts por formato */}
          {isStatic && AD_FORMAT_KEYS.map(fmt => {
            const prompts = buildExternalPrompts(fmt)
            return (
              <div key={fmt} className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Prompts para {AD_FORMATS[fmt].label}
                </p>
                {[
                  { tool: 'Midjourney', color: 'border-indigo-200 bg-indigo-50', textColor: 'text-indigo-700', prompt: prompts.midjourney, desc: 'Discord · /imagine [pega aquí]' },
                  { tool: 'Adobe Firefly', color: 'border-orange-200 bg-orange-50', textColor: 'text-orange-700', prompt: prompts.firefly, desc: 'firefly.adobe.com → Text to Image' },
                  { tool: 'Canva AI', color: 'border-teal-200 bg-teal-50', textColor: 'text-teal-700', prompt: prompts.canva, desc: 'Canva → Magic Media → Imagen' },
                ].map(({ tool, color, textColor, prompt, desc }) => (
                  <div key={tool} className={`rounded-lg border ${color} p-3 space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${textColor}`}>{tool}</span>
                      <span className="text-[9px] text-muted-foreground">{desc}</span>
                    </div>
                    <p className="text-[10px] font-mono text-foreground/70 leading-relaxed bg-black/5 rounded px-2 py-1.5 break-all">
                      {prompt}
                    </p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(prompt); toast.success(`Prompt ${tool} copiado`) }}
                      className={`inline-flex items-center gap-1 text-[10px] ${textColor} hover:opacity-70 transition-opacity`}
                    >
                      <Copy className="h-3 w-3" /> Copiar prompt
                    </button>
                  </div>
                ))}
              </div>
            )
          })}

          <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Flujo recomendado</p>
            {[
              '1. Genera el arte en la herramienta que prefieras usando el prompt de arriba',
              '2. Agrega el logo y texto en Adobe Express o Canva',
              '3. Exporta en los formatos que necesitas (cuadrado, vertical, horizontal)',
              '4. Sube los archivos en la pestaña "Subir arte" para guardarlos aquí',
            ].map((step, i) => (
              <p key={i} className="text-xs text-muted-foreground">{step}</p>
            ))}
          </div>

          <AdobeExpressBtn format={idea.contentType ?? 'Post'} />
        </div>
      )}

      {/* ── TAB: Subir arte ── */}
      {arteTab === 'subir' && (
        <div className="p-4 space-y-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">¿Para qué formato es este arte?</p>
            <div className="flex gap-1.5 flex-wrap">
              {AD_FORMAT_KEYS.map(fmt => {
                const hasAsset = localAssets.some(a => a.format === fmt)
                return (
                  <button key={fmt} onClick={() => setUploadFormat(fmt)}
                    className={`rounded-lg border px-2.5 py-1.5 text-left relative transition-colors ${uploadFormat === fmt ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground hover:border-foreground/40'}`}>
                    <span className="block text-xs font-medium">{AD_FORMATS[fmt].label}</span>
                    <span className={`block text-[9px] mt-0.5 ${uploadFormat === fmt ? 'opacity-70' : 'opacity-50'}`}>{AD_FORMATS[fmt].platforms}</span>
                    {hasAsset && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-foreground/40 hover:bg-muted/40 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground text-center font-medium">
              {uploadFile ? uploadFile.name : 'Clic para seleccionar imagen o video'}
            </p>
            <p className="text-[10px] text-muted-foreground/60">JPG · PNG · MP4 · MOV · Máx 50 MB</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/quicktime" className="hidden"
            onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />

          {uploadFile && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground">Vista previa</p>
              <div className={`${AD_FORMATS[uploadFormat].aspectClass} ${AD_FORMATS[uploadFormat].previewClass} overflow-hidden rounded-lg border border-border bg-muted`}>
                {uploadFile.type.startsWith('video/') ? (
                  <video src={URL.createObjectURL(uploadFile)} className="h-full w-full object-cover" controls />
                ) : (
                  <img src={URL.createObjectURL(uploadFile)} alt="Preview" className="h-full w-full object-cover" />
                )}
              </div>
            </div>
          )}

          <Button onClick={handleFileUpload} disabled={!uploadFile || uploading} size="sm" className="gap-1.5 w-full">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? 'Subiendo...' : `Subir como ${AD_FORMATS[uploadFormat].label}`}
          </Button>

          {localAssets.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Artes guardadas — {localAssets.length} formato{localAssets.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {localAssets.map(asset => {
                  const fmtCfg = AD_FORMATS[asset.format]
                  return (
                    <div key={asset.format} className="space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground">{fmtCfg.label}</p>
                      <div className={`${fmtCfg.aspectClass} ${fmtCfg.previewClass} w-full overflow-hidden rounded-lg border border-border bg-muted`}>
                        {asset.model === 'upload-video'
                          ? <video src={asset.url} className="h-full w-full object-cover" />
                          : <img src={asset.url} alt={asset.label} className="h-full w-full object-cover" />}
                      </div>
                      <a href={asset.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-2.5 w-2.5" /> Descargar
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditableCell({
  value,
  onSave,
  multiline = false,
}: {
  value: string | null
  onSave: (v: string) => void
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  function start() {
    setDraft(value ?? '')
    setEditing(true)
    setTimeout(() => ref.current?.focus(), 0)
  }

  function save() {
    setEditing(false)
    if (draft !== (value ?? '')) onSave(draft)
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          className="w-full min-h-[80px] resize-none rounded border border-ring bg-background px-2 py-1 text-xs focus:outline-none"
        />
      )
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save() }}
        className="w-full rounded border border-ring bg-background px-2 py-1 text-xs focus:outline-none"
      />
    )
  }

  return (
    <div
      onClick={start}
      className="group relative cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 min-h-[24px]"
    >
      <span className="text-xs text-foreground whitespace-pre-wrap">{value ?? ''}</span>
      <Pencil className="absolute right-1 top-1 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function IdeaDetail({ idea, isRefined }: { idea: PlanIdea; isRefined?: boolean }) {
  const cfg = IDEA_CONFIG[idea.type] ?? IDEA_CONFIG['disruptiva']
  const isVideo = VIDEO_FORMATS.some(f => idea.contentType?.toLowerCase().includes(f.toLowerCase()))
  const isCarousel = /carrusel|carousel/i.test(idea.contentType ?? '')
  const isGoogle = /google/i.test(idea.contentType ?? '')

  const contentLabel = isVideo
    ? 'Guion por escenas'
    : isCarousel
    ? 'Estructura de slides'
    : isGoogle
    ? 'Anuncio'
    : 'Copy completo'

  const hookLabel = isVideo ? 'Hook — primeros 3 segundos' : 'Apertura'

  const contentLines = (idea.development ?? '').split('\n').filter(l => l.trim())

  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5 space-y-4`}>
      {isRefined && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <RefreshCw className="h-3 w-3" />
          Versión refinada
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {idea.contentType && (
          <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {idea.contentType}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}>
          {cfg.icon}
          {cfg.label}
        </span>
        {isVideo && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Video</span>
        )}
        {isGoogle && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Google Ads</span>
        )}
      </div>

      {/* Hook */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{hookLabel}</p>
        <p className="text-sm font-medium text-foreground">{idea.hook}</p>
        {isVideo && idea.higgsfieldPrompt && (
          <div className="mt-2 rounded-lg bg-black/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Higgsfield — dirección visual</p>
            <p className="text-xs text-foreground/80 italic">{idea.higgsfieldPrompt}</p>
          </div>
        )}
      </div>

      {/* Rich production content */}
      {contentLines.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{contentLabel}</p>
          <div className="space-y-1.5">
            {contentLines.map((line, i) => {
              const isDurationOrTotal = /^(DURACIÓN|TOTAL|URL):/i.test(line)
              return (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 ${isDurationOrTotal ? 'bg-muted/60' : 'bg-black/[0.04]'}`}
                >
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono">{line}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA + KPI */}
      <div className="flex gap-4 pt-1">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">CTA</p>
          <p className="text-sm font-medium text-foreground">{idea.cta}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">KPI</p>
          <p className="text-sm text-foreground">{idea.kpi || '—'}</p>
        </div>
      </div>
    </div>
  )
}

function PreviewCard({ item, idx }: { item: ContentPlanItem; idx: number }) {
  const assets = item.generatedAssets ?? []
  if (assets.length === 0) return null

  const defaultFmt = (assets.find(a => a.format === 'square') ?? assets[0]).format
  const [selectedFormat, setSelectedFormat] = useState<AdFormat>(defaultFmt)

  const idea = item.rawIdeas?.ideas[0]
  const channel = item.rawIdeas?.channel ?? item.channel ?? 'Instagram'
  const copy = item.observations ?? ''
  const selectedAsset = assets.find(a => a.format === selectedFormat) ?? assets[0]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{idea?.name ?? item.temporality}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FUNNEL_COLORS[item.funnelStage]}`}>{FUNNEL_LABELS[item.funnelStage]}</span>
            <span className="text-[11px] text-muted-foreground">{channel}</span>
            {item.format && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {getFormatIcon(item.format)}{item.format}
              </span>
            )}
          </div>
        </div>
        {item.productionApproved && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            <Check className="h-3 w-3" /> Aprobado
          </span>
        )}
      </div>

      {assets.length > 1 && (
        <div className="flex gap-1.5 px-4 pt-3">
          {assets.map(a => (
            <button key={a.format} onClick={() => setSelectedFormat(a.format)}
              className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors ${selectedFormat === a.format ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>
              {AD_FORMATS[a.format].label}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 flex flex-col md:flex-row gap-6 items-start">
        <div className="shrink-0 flex justify-center w-full md:w-auto">
          <SocialMockup asset={selectedAsset} channel={channel} copy={copy} />
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Copy para publicar</p>
            <div className="rounded-lg bg-muted/40 border border-border px-3 py-3">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{copy}</p>
              <button onClick={() => navigator.clipboard.writeText(copy).then(() => toast.success('Copy copiado'))}
                className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                <Copy className="h-3 w-3" /> Copiar copy completo
              </button>
            </div>
          </div>

          <PautaCard funnelStage={item.funnelStage} channel={channel} />
        </div>
      </div>
    </div>
  )
}

export default function PlanDetailPage({ params }: Props) {
  const { brandId, planId } = use(params)
  const { data, isLoading } = useContentPlan(planId)
  const { data: brand } = useBrandDetail(brandId)
  const { data: expansionRequests = [] } = useExpansionRequests(planId)
  const { mutateAsync: createExpansionRequest, isPending: requestingExpansion } = useCreateExpansionRequest(planId)
  const { mutateAsync: reviewExpansionRequest } = useReviewExpansionRequest(planId)
  const { mutateAsync: generateBrief, isPending: generatingBrief } = useGenerateBrief(planId)
  const { mutateAsync: generate, isPending: generating } = useGeneratePlan(planId)
  const { mutateAsync: updatePlan, isPending: savingBrief } = useUpdatePlan(planId)
  const { mutateAsync: updateItem } = useUpdatePlanItem(planId)
  const { mutateAsync: refineIdea, isPending: refining } = useRefineIdea(planId)
  const { mutateAsync: producePlan, isPending: producing } = useProducePlan(planId)

  const plan = data?.plan
  const items = data?.items ?? []

  // Step 1 state
  const [channelMix, setChannelMix] = useState<string[]>(['Instagram', 'Facebook'])
  const [funnelFocus, setFunnelFocus] = useState('balanced')

  // Step 2 brief editing
  const [editingBrief, setEditingBrief] = useState(false)
  const [briefDraft, setBriefDraft] = useState('')
  const [showBrief, setShowBrief] = useState(false)

  // Step 5 tabs state
  const [productionTabs, setProductionTabs] = useState<Record<string, 'copy' | 'arte'>>({})

  // Step 3 wizard state
  const [reviewItemId, setReviewItemId] = useState<string | null>(null)
  const [refineMode, setRefineMode] = useState(false)
  const [refineFeedback, setRefineFeedback] = useState('')
  const [refinedIdea, setRefinedIdea] = useState<PlanIdea | null>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)

  // Expansion request popup
  const [expansionCheck, setExpansionCheck] = useState<{ expected: number; limit: number } | null>(null)

  // Sync channel mix and funnel focus from stored plan data on load
  useEffect(() => {
    if (plan?.channelMix?.length) setChannelMix(plan.channelMix)
    if (plan?.funnelFocus) setFunnelFocus(plan.funnelFocus)
  }, [plan?.id])

  function toggleChannel(ch: string) {
    setChannelMix(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )
  }

  async function handleGenerateBrief() {
    if (channelMix.length === 0) {
      toast.error('Selecciona al menos un canal')
      return
    }
    const computedPieces = (plan?.products?.length ?? 1) * 7
    try {
      await generateBrief({ channelMix, funnelFocus, piecesCount: computedPieces })
      toast.success('Brief estratégico generado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar brief')
    }
  }

  async function handleSaveBrief() {
    try {
      await updatePlan({ strategicBrief: briefDraft })
      setEditingBrief(false)
      toast.success('Brief actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  async function handleResetBrief() {
    try {
      await updatePlan({ strategicBrief: null })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const PIECES_PER_PRODUCT = 7

  async function handleGenerate() {
    setReviewItemId(null)
    setRefinedIdea(null)
    setRefineMode(false)
    setConfirmRegen(false)

    const expectedPieces = (plan?.products?.length ?? 0) * PIECES_PER_PRODUCT
    const limit = brand?.monthlyPiecesLimit
    if (limit && expectedPieces > limit) {
      const hasApproved = expansionRequests.some(r => r.status === 'approved')
      if (!hasApproved) {
        setExpansionCheck({ expected: expectedPieces, limit })
        return
      }
    }

    await doGenerate()
  }

  async function doGenerate() {
    try {
      await generate()
      toast.success('Ideas generadas — revisa y aprueba cada pieza')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar')
    }
  }

  async function handleRequestExpansion() {
    if (!expansionCheck || !brand) return
    const additional = expansionCheck.expected - expansionCheck.limit
    const reason = `Plan de ${plan?.products?.length ?? 0} producto(s) requiere ${expansionCheck.expected} piezas; plan contratado incluye ${expansionCheck.limit}. Se solicitan ${additional} piezas adicionales.`
    try {
      await createExpansionRequest({
        brandId: brand.brandId,
        includedPieces: expansionCheck.limit,
        requiredPieces: expansionCheck.expected,
        reason,
      })
      setExpansionCheck(null)
      toast.success('Solicitud de ampliación enviada — aguarda aprobación para generar el plan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar solicitud')
    }
  }

  async function handleRefine() {
    if (!reviewItemId || !refineFeedback.trim()) return
    const item = items.find(i => i.id === reviewItemId)
    if (!item?.rawIdeas) return
    const baseIdea = refinedIdea ?? item.rawIdeas.ideas[0]
    if (!baseIdea) return

    const currentSet = {
      ...item.rawIdeas,
      ideas: refinedIdea
        ? item.rawIdeas.ideas.map(i => i.type === refinedIdea.type ? refinedIdea : i)
        : item.rawIdeas.ideas,
    }

    try {
      const refined = await refineIdea({
        itemId: reviewItemId,
        ideaType: baseIdea.type,
        feedback: refineFeedback.trim(),
        currentIdeaSet: currentSet,
      })
      setRefinedIdea(refined)
      setRefineMode(false)
      setRefineFeedback('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al refinar')
    }
  }

  async function handleApproveIdea() {
    if (!reviewItemId) return
    const item = items.find(i => i.id === reviewItemId)
    if (!item?.rawIdeas) return
    const idea = refinedIdea ?? item.rawIdeas.ideas[0]
    if (!idea) return

    // Decide navigation BEFORE the async call — items state is stable here
    const currentIdx = items.indexOf(item)
    const nextPending =
      items.slice(currentIdx + 1).find(i => i.status !== 'approved' && i.rawIdeas) ??
      items.slice(0, currentIdx).find(i => i.status !== 'approved' && i.rawIdeas)

    // Persist the approved idea (original or refined) as ideas[0] so all downstream
    // steps (produce, generate-image) always read the correct guion
    const persistedIdeaSet: typeof item.rawIdeas = {
      ...item.rawIdeas,
      ideas: [idea, ...item.rawIdeas.ideas.slice(1)],
    }

    try {
      await updateItem({
        itemId: reviewItemId,
        patch: {
          selectedIdeaType: idea.type,
          status: 'approved',
          idea: `${idea.name}: ${idea.hook}`,
          format: idea.contentType,
          channel: item.rawIdeas.channel,
          objective: idea.funnelObjective || item.rawIdeas.funnelStage,
          kpi: idea.kpi,
          mainMessage: idea.hook,
          cta: idea.cta,
          benchmarkReference: idea.benchmarkReference,
          rawIdeas: persistedIdeaSet,
        },
      })

      if (nextPending) {
        setReviewItemId(nextPending.id)
        setRefinedIdea(null)
        setRefineMode(false)
        setRefineFeedback('')
        toast.success('Pieza aprobada — siguiente')
      } else {
        setReviewItemId(null)
        setRefinedIdea(null)
        toast.success('¡Plan de ideas completo! Genera los copys cuando estés listo.')
        try { await updatePlan({ status: 'active' }) } catch {}
      }
    } catch {
      toast.error('Error al aprobar pieza')
    }
  }

  async function handleProduce() {
    try {
      await producePlan()
      toast.success('Copys de producción generados')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar copys')
    }
  }

  async function handleUpdateField(itemId: string, field: keyof ContentPlanItem, value: string) {
    try {
      await updateItem({ itemId, patch: { [field]: value } })
    } catch {
      toast.error('Error al guardar cambio')
    }
  }

  async function handleStatus(itemId: string, status: 'approved' | 'rejected' | 'draft') {
    try {
      await updateItem({ itemId, patch: { status } })
      toast.success(status === 'approved' ? 'Aprobado' : status === 'rejected' ? 'Rechazado' : 'Restablecido')
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Cargando...</div>

  const monthLabel = plan ? `${MONTH_NAMES[plan.month - 1]} ${plan.year}` : '—'

  const Header = (
    <div className="mb-8">
      <Link
        href={`/brands/${brandId}/plans`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a planes
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{monthLabel}</h1>
      {plan?.products && (
        <div className="mt-2 flex flex-wrap gap-2">
          {plan.products.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {p.name} · <span className="text-foreground">{p.objective}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )

  // ── STEP 1: Define strategy ─────────────────────────────────────
  if (!plan?.strategicBrief) {
    const numProducts = plan?.products?.length ?? 1
    const totalPieces = numProducts * 7

    return (
      <div className="p-8 max-w-2xl">
        {Header}

        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">1</span>
          <span className="font-medium text-foreground">Estrategia</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">2</span>
          <span className="text-muted-foreground">Brief</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">3</span>
          <span className="text-muted-foreground">Plan de contenidos</span>
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
          <p className="text-sm text-violet-800">
            Generaré un funnel completo por cada producto: <strong>{totalPieces} piezas</strong> ({numProducts} producto{numProducts !== 1 ? 's' : ''} × 7 etapas). Confirma los canales y el enfoque del mes.
          </p>
        </div>

        <div className="space-y-4">
          {/* Funnel distribution info */}
          <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Distribución del funnel por producto</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Awareness', pieces: 2, color: 'bg-purple-100 text-purple-700' },
                { label: 'Consideración', pieces: 2, color: 'bg-blue-100 text-blue-700' },
                { label: 'Conversión', pieces: 2, color: 'bg-green-100 text-green-700' },
                { label: 'Remarketing', pieces: 1, color: 'bg-pink-100 text-pink-700' },
              ].map(stage => (
                <div key={stage.label} className={`rounded-lg px-2 py-2.5 ${stage.color}`}>
                  <p className="text-lg font-bold">{stage.pieces}</p>
                  <p className="text-[10px] font-medium leading-tight mt-0.5">{stage.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Cada pieza incluye guion, slides o copy completo listo para producción
            </p>
          </div>

          {/* Channels */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-card-foreground">¿En qué canales publicarán?</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Activa los canales que usará la marca este mes</p>
            </div>
            <div className="space-y-1.5">
              {CHANNELS.map(ch => {
                const info = CHANNEL_INFO[ch]
                const active = channelMix.includes(ch)
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all ${
                      active
                        ? 'border-foreground/30 bg-foreground/5'
                        : 'border-border bg-background hover:border-foreground/25 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-none mb-0.5 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{ch}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${active ? 'border-foreground bg-foreground' : 'border-muted-foreground/40'}`}>
                      {active && <Check className="h-3 w-3 text-background" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Funnel focus */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-card-foreground">¿Cuál es la prioridad estratégica del mes?</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Define el foco para la distribución de contenidos</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FUNNEL_FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFunnelFocus(opt.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    funnelFocus === opt.value
                      ? 'border-foreground bg-foreground/5'
                      : 'border-border hover:border-foreground/50'
                  }`}
                >
                  <p className="text-sm font-medium text-card-foreground">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerateBrief}
            disabled={generatingBrief || channelMix.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            {generatingBrief ? 'Generando brief...' : 'Generar brief estratégico'}
          </Button>
        </div>
      </div>
    )
  }

  // ── STEP 2: Review brief ────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="p-8 max-w-3xl">
        {expansionCheck && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <span className="text-lg font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Límite del plan mensual alcanzado</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Se requieren <strong>{expansionCheck.expected} piezas</strong>, pero el plan contratado incluye <strong>{expansionCheck.limit} piezas</strong>.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Se necesitan <strong className="text-amber-600">{expansionCheck.expected - expansionCheck.limit} piezas adicionales</strong>. ¿Deseas solicitar esta ampliación?
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={handleRequestExpansion} disabled={requestingExpansion} className="w-full">
                  {requestingExpansion ? 'Enviando solicitud...' : 'Solicitar ampliación'}
                </Button>
                <Button variant="outline" onClick={() => { setExpansionCheck(null); doGenerate() }} className="w-full">
                  Generar de todas formas
                </Button>
                <Button variant="ghost" onClick={() => setExpansionCheck(null)} className="w-full">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
        {Header}

        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            <Check className="h-3.5 w-3.5" />
          </span>
          <span className="text-muted-foreground">Estrategia</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">2</span>
          <span className="font-medium text-foreground">Brief</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">3</span>
          <span className="text-muted-foreground">Ideas de contenido</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">Brief estratégico</h2>
            {!editingBrief && (
              <button
                onClick={() => { setBriefDraft(plan.strategicBrief ?? ''); setEditingBrief(true) }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            )}
          </div>

          {editingBrief ? (
            <div className="space-y-3">
              <textarea
                value={briefDraft}
                onChange={e => setBriefDraft(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveBrief} disabled={savingBrief}>
                  {savingBrief ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingBrief(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-card-foreground">
              {plan.strategicBrief?.split('\n').map((line, i) => {
                if (line.startsWith('### ')) return <h3 key={i} className="mt-4 mb-1 text-sm font-semibold text-foreground">{line.slice(4)}</h3>
                if (line.startsWith('## ')) return <h2 key={i} className="mt-5 mb-1 text-base font-bold text-foreground">{line.slice(3)}</h2>
                if (line.startsWith('- ')) return <p key={i} className="flex gap-2 text-sm text-muted-foreground my-0.5"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" /><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} /></p>
                if (/^\d+\./.test(line)) return <p key={i} className="text-sm text-muted-foreground my-0.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                if (line.trim() === '') return <div key={i} className="h-1" />
                return <p key={i} className="text-sm text-muted-foreground my-0.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleResetBrief}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            ← Volver a configurar
          </button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Creando contenido...' : 'Crear contenido'}
          </Button>
        </div>

        {generating && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
            Claude está creando guiones, slides y copy para cada pieza...
          </div>
        )}
      </div>
    )
  }

  // ── STEP 3: Idea wizard or table ────────────────────────────────
  const hasIdeas = items.some(i => i.rawIdeas != null)
  const approvedCount = items.filter(i => i.status === 'approved').length
  const allApproved = approvedCount === items.length
  const hasProductionCopy = items.some(i => i.status === 'approved' && !!i.observations)

  // Legacy table view (items generated before the 3-idea format)
  if (!hasIdeas) {
    return (
      <div className="p-8">
        <Link
          href={`/brands/${brandId}/plans`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a planes
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{monthLabel}</h1>
          </div>
          <Button onClick={handleGenerate} disabled={generating} variant="outline" className="gap-2 shrink-0">
            <Sparkles className="h-4 w-4" />
            {generating ? 'Regenerando...' : 'Regenerar plan'}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-20">Estado</th>
                {COLUMNS.map(col => (
                  <th key={col.key} className={`px-3 py-2.5 text-left text-xs font-medium text-muted-foreground ${col.width}`}>
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-border ${
                    item.status === 'approved' ? 'bg-green-50/50' :
                    item.status === 'rejected' ? 'bg-red-50/30 opacity-60' :
                    idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[item.status]}`}>
                      {item.status === 'draft' ? 'Revisión' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell value={item.temporality} onSave={v => handleUpdateField(item.id, 'temporality', v)} />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.funnelStage}
                      onChange={e => handleUpdateField(item.id, 'funnelStage', e.target.value)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium cursor-pointer focus:outline-none ${FUNNEL_COLORS[item.funnelStage]}`}
                    >
                      {(Object.keys(FUNNEL_LABELS) as FunnelStage[]).map(s => (
                        <option key={s} value={s}>{FUNNEL_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  {(['objective', 'idea'] as const).map(field => (
                    <td key={field} className="px-3 py-2 align-top">
                      <EditableCell value={item[field]} onSave={v => handleUpdateField(item.id, field, v)} multiline />
                    </td>
                  ))}
                  <td className="px-3 py-2"><EditableCell value={item.format} onSave={v => handleUpdateField(item.id, 'format', v)} /></td>
                  <td className="px-3 py-2"><EditableCell value={item.channel} onSave={v => handleUpdateField(item.id, 'channel', v)} /></td>
                  <td className="px-3 py-2 align-top"><EditableCell value={item.kpi} onSave={v => handleUpdateField(item.id, 'kpi', v)} multiline /></td>
                  <td className="px-3 py-2 align-top"><EditableCell value={item.mainMessage} onSave={v => handleUpdateField(item.id, 'mainMessage', v)} multiline /></td>
                  <td className="px-3 py-2"><EditableCell value={item.cta} onSave={v => handleUpdateField(item.id, 'cta', v)} /></td>
                  <td className="px-3 py-2 align-top"><EditableCell value={item.observations} onSave={v => handleUpdateField(item.id, 'observations', v)} multiline /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {item.status !== 'approved' && (
                        <button onClick={() => handleStatus(item.id, 'approved')} className="rounded p-1 text-green-600 hover:bg-green-100" title="Aprobar">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {item.status !== 'rejected' && (
                        <button onClick={() => handleStatus(item.id, 'rejected')} className="rounded p-1 text-red-500 hover:bg-red-100" title="Rechazar">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── STEP 3: idea review ─────────────────────────────────────────
  const reviewItem = reviewItemId ? items.find(i => i.id === reviewItemId) : null
  const currentItemIdx = reviewItem ? items.indexOf(reviewItem) : -1

  if (reviewItem?.rawIdeas) {
    const isApprovedReview = reviewItem.status === 'approved'
    const baseIdea = reviewItem.rawIdeas.ideas[0]
    const displayIdea = refinedIdea ?? baseIdea

    return (
      <div className="p-8 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => { setReviewItemId(null); setRefinedIdea(null); setRefineMode(false) }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Resumen
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{currentItemIdx + 1} / {items.length}</span>
            <button
              onClick={() => {
                const prev = items[currentItemIdx - 1]
                if (prev) { setReviewItemId(prev.id); setRefinedIdea(null); setRefineMode(false); setRefineFeedback('') }
              }}
              disabled={currentItemIdx <= 0}
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const next = items[currentItemIdx + 1]
                if (next) { setReviewItemId(next.id); setRefinedIdea(null); setRefineMode(false); setRefineFeedback('') }
              }}
              disabled={currentItemIdx >= items.length - 1}
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-bold text-foreground">{reviewItem.temporality}</h2>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${FUNNEL_COLORS[reviewItem.funnelStage]}`}>
              {FUNNEL_LABELS[reviewItem.funnelStage]}
            </span>
            {reviewItem.rawIdeas.product && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {reviewItem.rawIdeas.product}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{reviewItem.rawIdeas.channel}</span>
          </div>
          {reviewItem.rawIdeas.targetEmotion && (
            <p className="text-xs text-muted-foreground">Emoción objetivo: {reviewItem.rawIdeas.targetEmotion}</p>
          )}
        </div>

        {displayIdea && (
          <div className="space-y-4">
            <IdeaDetail idea={displayIdea} isRefined={!!refinedIdea} />

            {isApprovedReview ? (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">Esta pieza está aprobada. Solo lectura.</p>
              </div>
            ) : refineMode ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">¿Qué ajuste necesita esta pieza?</p>
                <textarea
                  value={refineFeedback}
                  onChange={e => setRefineFeedback(e.target.value)}
                  rows={3}
                  placeholder="Ej: Cambia el tono a más directo, ajusta el guion para enfocarse en el precio, modifica el CTA..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleRefine} disabled={refining || !refineFeedback.trim()} className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {refining ? 'Ajustando...' : 'Generar versión ajustada'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRefineMode(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {refinedIdea ? (
                  <>
                    <Button onClick={handleApproveIdea} className="gap-1.5">
                      <Check className="h-4 w-4" />
                      Usar versión ajustada
                    </Button>
                    <Button variant="outline" onClick={() => setRefineMode(true)} className="gap-1.5">
                      <RefreshCw className="h-4 w-4" />
                      Ajustar más
                    </Button>
                    <Button variant="ghost" onClick={() => setRefinedIdea(null)} className="text-muted-foreground text-sm">
                      Ver original
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleApproveIdea} className="gap-1.5">
                      <Check className="h-4 w-4" />
                      Usar esta idea
                    </Button>
                    <Button variant="outline" onClick={() => setRefineMode(true)} className="gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Ajustar con feedback
                    </Button>
                  </>
                )}
              </div>
            )}

            {isApprovedReview && (
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-700">
                  Pieza aprobada. Genera los copys finales y luego podrás crear el arte visual.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── STEP 3 overview ─────────────────────────────────────────────
  const pendingRequest = expansionRequests.find(r => r.status === 'pending')
  const approvedRequest = expansionRequests.find(r => r.status === 'approved')

  return (
    <div className="p-8 max-w-4xl">
      {/* Expansion request popup */}
      {expansionCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <span className="text-lg font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Límite del plan mensual alcanzado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Para cumplir el objetivo mensual se requieren <strong>{expansionCheck.expected} piezas</strong>, pero el plan contratado incluye <strong>{expansionCheck.limit} piezas</strong>.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Se necesitan <strong className="text-amber-600">{expansionCheck.expected - expansionCheck.limit} piezas adicionales</strong>. ¿Deseas solicitar esta ampliación antes de continuar?
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleRequestExpansion}
                disabled={requestingExpansion}
                className="w-full"
              >
                {requestingExpansion ? 'Enviando solicitud...' : 'Solicitar ampliación'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setExpansionCheck(null)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Expansion request banners */}
      {pendingRequest && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <span className="font-semibold">Ampliación pendiente:</span>
            <span>+{pendingRequest.additionalPieces} piezas — aguarda aprobación para generar el plan</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={() => reviewExpansionRequest({ requestId: pendingRequest.id, status: 'approved' })}>
              Aprobar
            </Button>
            <Button size="sm" variant="outline" onClick={() => reviewExpansionRequest({ requestId: pendingRequest.id, status: 'rejected' })}>
              Rechazar
            </Button>
          </div>
        </div>
      )}
      {approvedRequest && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span><strong>Ampliación aprobada:</strong> +{approvedRequest.additionalPieces} piezas adicionales disponibles para este mes.</span>
        </div>
      )}

      <Link
        href={`/brands/${brandId}/plans`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a planes
      </Link>

      <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className="text-muted-foreground">Estrategia</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className="text-muted-foreground">Brief</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${allApproved ? 'bg-muted text-muted-foreground' : 'bg-foreground text-background'}`}>
          {allApproved ? <Check className="h-3.5 w-3.5" /> : '3'}
        </span>
        <span className={allApproved ? 'text-muted-foreground' : 'font-medium text-foreground'}>Ideas</span>
        {allApproved && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasProductionCopy ? 'bg-muted text-muted-foreground' : 'bg-foreground text-background'}`}>
              {hasProductionCopy ? <Check className="h-3.5 w-3.5" /> : '4'}
            </span>
            <span className={hasProductionCopy ? 'text-muted-foreground' : 'font-medium text-foreground'}>Copys</span>
            {hasProductionCopy && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">5</span>
                <span className="font-medium text-foreground">Arte</span>
              </>
            )}
          </>
        )}
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{monthLabel}</h1>
          {plan?.products && (
            <div className="mt-2 flex flex-wrap gap-2">
              {plan.products.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {p.name} · <span className="text-foreground">{p.objective}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {confirmRegen ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Se borrará el contenido actual</span>
            <Button onClick={handleGenerate} disabled={generating} variant="destructive" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Confirmar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmRegen(false)}>Cancelar</Button>
          </div>
        ) : (
          <Button onClick={() => setConfirmRegen(true)} disabled={generating} variant="outline" size="sm" className="gap-2 shrink-0">
            <Sparkles className="h-4 w-4" />
            {generating ? 'Reconstruyendo...' : 'Reconstruir plan'}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">
            {allApproved ? 'Todas las ideas aprobadas' : `${approvedCount} de ${items.length} ideas aprobadas`}
          </p>
          <span className="text-sm text-muted-foreground">{Math.round((approvedCount / items.length) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${(approvedCount / items.length) * 100}%` }}
          />
        </div>
        {!allApproved && (
          <p className="mt-2 text-xs text-muted-foreground">
            Haz clic en cualquier pieza pendiente para revisar y aprobar el contenido
          </p>
        )}
      </div>

      {/* Phase 4: production copy */}
      {allApproved && (
        <div className={`mb-6 rounded-xl border-2 p-5 ${hasProductionCopy ? 'border-green-200 bg-green-50/60' : 'border-violet-200 bg-violet-50/60'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Check className={`h-4 w-4 ${hasProductionCopy ? 'text-green-600' : 'text-violet-600'}`} />
                <h2 className={`text-sm font-bold ${hasProductionCopy ? 'text-green-800' : 'text-violet-800'}`}>
                  {hasProductionCopy ? '¡Copys de producción listos!' : 'Paso 4: Generar copys de producción'}
                </h2>
              </div>
              <p className={`text-xs ${hasProductionCopy ? 'text-green-700' : 'text-violet-700'}`}>
                {hasProductionCopy
                  ? 'Los copys están listos. Ahora puedes generar el arte visual para cada pieza.'
                  : 'Claude genera el caption final, hook en pantalla y hashtags. Luego podrás crear el arte visual de cada pieza.'}
              </p>
            </div>
            <Button
              onClick={handleProduce}
              disabled={producing}
              size="sm"
              className={`shrink-0 gap-1.5 ${hasProductionCopy ? 'bg-green-700 hover:bg-green-800' : 'bg-violet-700 hover:bg-violet-800'} text-white`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {producing ? 'Generando...' : hasProductionCopy ? 'Regenerar copys' : 'Generar copys'}
            </Button>
          </div>
          {producing && (
            <p className="mt-3 text-xs text-violet-600 animate-pulse">
              Claude está escribiendo captions y hashtags para cada pieza...
            </p>
          )}
        </div>
      )}

      {/* Collapsible brief */}
      {plan?.strategicBrief && (
        <div className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowBrief(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
          >
            <span className="font-medium text-card-foreground">Brief estratégico del mes</span>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showBrief ? 'rotate-90' : ''}`} />
          </button>
          {showBrief && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              <div className="prose prose-sm max-w-none text-card-foreground">
                {plan.strategicBrief.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) return <h3 key={i} className="mt-3 mb-1 text-sm font-semibold text-foreground">{line.slice(4)}</h3>
                  if (line.startsWith('## ')) return <h2 key={i} className="mt-4 mb-1 text-sm font-bold text-foreground">{line.slice(3)}</h2>
                  if (line.startsWith('- ')) return <p key={i} className="flex gap-2 text-xs text-muted-foreground my-0.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" /><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} /></p>
                  if (line.trim() === '') return <div key={i} className="h-1" />
                  return <p key={i} className="text-xs text-muted-foreground my-0.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {generating && (
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground animate-pulse">
          Claude está regenerando las ideas de contenido...
        </div>
      )}

      {/* Items grouped by product */}
      {(() => {
        const grouped: Record<string, typeof items> = {}
        items.forEach(item => {
          const key = item.rawIdeas?.product ?? 'General'
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(item)
        })
        return Object.entries(grouped).map(([product, productItems]) => (
          <div key={product} className="space-y-2">
            {Object.keys(grouped).length > 1 && (
              <div className="flex items-center gap-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product}</p>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {productItems.map((item, idx) => {
              const isApproved = item.status === 'approved'
              const ideaCfg = item.selectedIdeaType ? IDEA_CONFIG[item.selectedIdeaType] : null
              const globalIdx = items.indexOf(item)
              return (
                <div
                  key={item.id}
                  onClick={() => item.rawIdeas && setReviewItemId(item.id)}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    isApproved
                      ? 'border-green-200 bg-green-50/50 cursor-pointer hover:border-green-300 hover:shadow-sm'
                      : item.rawIdeas
                      ? 'border-border bg-card cursor-pointer hover:border-foreground/40 hover:shadow-sm'
                      : 'border-border bg-card cursor-default'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {globalIdx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.rawIdeas?.ideas[0]?.name ?? item.temporality ?? `Pieza ${idx + 1}`}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {item.rawIdeas?.ideas[0]?.contentType && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {getFormatIcon(item.rawIdeas.ideas[0].contentType)}
                          {item.rawIdeas.ideas[0].contentType}
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FUNNEL_COLORS[item.funnelStage]}`}>
                        {FUNNEL_LABELS[item.funnelStage]}
                      </span>
                      {item.rawIdeas?.channel && (
                        <span className="text-[11px] text-muted-foreground">{item.rawIdeas.channel}</span>
                      )}
                    </div>
                    {item.temporality && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60 truncate">{item.temporality}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {isApproved ? (
                      <div className="flex items-center gap-2">
                        {ideaCfg && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ideaCfg.badge}`}>
                            {ideaCfg.icon}
                            {ideaCfg.label}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          <Check className="h-3 w-3" />
                          Aprobada
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Revisar
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))
      })()}

      {/* Step 5: Copys + Arte */}
      {hasProductionCopy && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background shrink-0">5</div>
            <div>
              <h2 className="text-base font-bold text-foreground">Copys y arte visual</h2>
              <p className="text-xs text-muted-foreground">Copy listo para publicar + imagen generada con IA para cada pieza</p>
            </div>
          </div>

          {items.filter(i => i.status === 'approved' && i.observations).map((item, idx) => {
            const idea = item.rawIdeas?.ideas[0]
            const ideaCfg = item.selectedIdeaType ? IDEA_CONFIG[item.selectedIdeaType] : null
            const isVideoItem = idea ? VIDEO_FORMATS.some(f => idea.contentType?.toLowerCase().includes(f.toLowerCase())) : false
            const tab = productionTabs[item.id] ?? 'copy'
            const arteLabel = isVideoItem ? 'Video' : 'Arte'
            const assetCount = (item.generatedAssets ?? []).length
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{idea?.name ?? item.temporality}</p>
                    {item.format && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {getFormatIcon(item.format)}
                        {item.format}
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FUNNEL_COLORS[item.funnelStage]}`}>
                      {FUNNEL_LABELS[item.funnelStage]}
                    </span>
                    {item.rawIdeas?.channel && (
                      <span className="text-xs text-muted-foreground">{item.rawIdeas.channel}</span>
                    )}
                    {ideaCfg && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ideaCfg.badge}`}>
                        {ideaCfg.icon}{ideaCfg.label}
                      </span>
                    )}
                    {item.productionApproved && (
                      <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-semibold text-green-700">
                        <Check className="h-3 w-3" />
                        Aprobado para publicar
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setProductionTabs(t => ({ ...t, [item.id]: 'copy' }))}
                    className={`px-5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                      tab === 'copy'
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Copy
                  </button>
                  {idea && (
                    <button
                      onClick={() => setProductionTabs(t => ({ ...t, [item.id]: 'arte' }))}
                      className={`px-5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                        tab === 'arte'
                          ? 'border-foreground text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {arteLabel}
                      {assetCount > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-100 text-[9px] font-bold text-green-700">
                          {assetCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Tab content */}
                {tab === 'copy' && (
                  <div className="px-4 pt-4 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Copy de producción</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(item.observations ?? '')}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar
                      </button>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                      {item.observations}
                    </p>
                  </div>
                )}

                {tab === 'arte' && idea && (
                  <div className="px-4 pb-4 pt-4 space-y-4">
                    <CreativeTools
                      idea={idea}
                      planId={planId}
                      itemId={item.id}
                      persistedAssets={item.generatedAssets ?? []}
                    />

                    {/* Production approval */}
                    <div className={`rounded-xl border-2 px-4 py-3 flex items-center justify-between gap-4 ${item.productionApproved ? 'border-green-200 bg-green-50' : 'border-dashed border-border bg-muted/30'}`}>
                      {item.productionApproved ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0" />
                            <p className="text-sm font-medium text-green-800">Arte aprobado para publicar</p>
                          </div>
                          <button
                            onClick={() => updateItem({ itemId: item.id, patch: { productionApproved: false } })}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Reabrir
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {(item.generatedAssets ?? []).length > 0
                              ? `${item.generatedAssets!.length} formato${item.generatedAssets!.length !== 1 ? 's' : ''} generado${item.generatedAssets!.length !== 1 ? 's' : ''} — ¿listo para publicar?`
                              : 'Genera el arte antes de aprobar'}
                          </p>
                          <Button
                            onClick={() => updateItem({ itemId: item.id, patch: { productionApproved: true } })}
                            disabled={(item.generatedAssets ?? []).length === 0}
                            size="sm"
                            className="gap-1.5 bg-green-700 hover:bg-green-800 text-white shrink-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Aprobar para publicar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Step 6: Full preview + pauta */}
      {hasProductionCopy && items.some(i => (i.generatedAssets ?? []).length > 0) && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background shrink-0">6</div>
            <div>
              <h2 className="text-base font-bold text-foreground">Previsualización para publicar</h2>
              <p className="text-xs text-muted-foreground">Mockup en red social · Copy · Info de pauta · Fecha recomendada de publicación</p>
            </div>
          </div>

          {items
            .filter(i => i.status === 'approved' && (i.generatedAssets ?? []).length > 0)
            .map((item, idx) => (
              <PreviewCard key={item.id} item={item} idx={idx} />
            ))
          }
        </div>
      )}
    </div>
  )
}
