import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ContentPlan, ContentPlanItem, PlanProduct, PlanAudience, PlanIdeaSet,
  FunnelStage, FunnelStageV2, FunnelDistribution, PlanItemStatus, IdeaType, GeneratedAsset,
  ContentCategory, ProductionType, ConversionChannel,
} from '@/types/domain'

type PlanRow = {
  id: string
  brand_id: string
  month: number
  year: number
  status: string
  products: unknown
  audiences: unknown
  context: string | null
  strategic_brief: string | null
  channel_mix: string[]
  funnel_focus: string
  funnel_distribution: unknown
  pieces_count: number
  total_pieces: number | null
  created_at: string
  updated_at: string
}

type PlanItemRow = {
  id: string
  plan_id: string
  temporality: string | null
  scheduled_date: string | null
  funnel_stage: string
  objective: string | null
  idea: string | null
  format: string | null
  channel: string | null
  kpi: string | null
  benchmark_reference: string | null
  main_message: string | null
  cta: string | null
  observations: string | null
  status: string
  content_item_id: string | null
  sort_order: number
  raw_ideas: unknown
  selected_idea_type: string | null
  generated_assets: unknown
  production_approved: boolean
  content_category: string | null
  production_type: string | null
  conversion_channel: string | null
  target_audience: string | null
  created_at: string
  updated_at: string
}

function toPlan(row: PlanRow): ContentPlan {
  return {
    id: row.id,
    brandId: row.brand_id,
    month: row.month,
    year: row.year,
    status: row.status as ContentPlan['status'],
    products: (row.products as PlanProduct[]) ?? [],
    audiences: (row.audiences as PlanAudience[]) ?? [],
    context: row.context,
    strategicBrief: row.strategic_brief ?? null,
    channelMix: row.channel_mix ?? [],
    funnelFocus: row.funnel_focus ?? 'balanced',
    funnelDistribution: (row.funnel_distribution as FunnelDistribution | null) ?? null,
    piecesCount: row.pieces_count ?? 12,
    totalPieces: row.total_pieces ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function toPlanItem(row: PlanItemRow): ContentPlanItem {
  return {
    id: row.id,
    planId: row.plan_id,
    temporality: row.temporality,
    scheduledDate: row.scheduled_date,
    funnelStage: row.funnel_stage as FunnelStageV2 | FunnelStage,
    objective: row.objective,
    idea: row.idea,
    format: row.format,
    channel: row.channel,
    kpi: row.kpi,
    benchmarkReference: row.benchmark_reference,
    mainMessage: row.main_message,
    cta: row.cta,
    observations: row.observations,
    status: row.status as PlanItemStatus,
    contentItemId: row.content_item_id,
    sortOrder: row.sort_order,
    rawIdeas: (row.raw_ideas as PlanIdeaSet | null) ?? null,
    selectedIdeaType: (row.selected_idea_type as IdeaType | null) ?? null,
    generatedAssets: (row.generated_assets as GeneratedAsset[]) ?? [],
    productionApproved: row.production_approved ?? false,
    contentCategory: (row.content_category as ContentCategory | null) ?? null,
    productionType: (row.production_type as ProductionType | null) ?? null,
    conversionChannel: (row.conversion_channel as ConversionChannel | null) ?? null,
    targetAudience: row.target_audience ?? null,
  }
}

export async function listPlansByBrand(
  supabase: SupabaseClient,
  brandId: string,
): Promise<ContentPlan[]> {
  const { data, error } = await supabase
    .from('content_plans')
    .select('*')
    .eq('brand_id', brandId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => toPlan(r as PlanRow))
}

export async function createPlan(
  supabase: SupabaseClient,
  input: { brandId: string; month: number; year: number; products: PlanProduct[]; audiences?: PlanAudience[]; context?: string },
): Promise<ContentPlan> {
  const { data, error } = await supabase
    .from('content_plans')
    .insert({
      brand_id: input.brandId,
      month: input.month,
      year: input.year,
      products: input.products,
      audiences: input.audiences ?? [],
      context: input.context ?? null,
      status: 'draft',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toPlan(data as PlanRow)
}

export async function getPlanWithItems(
  supabase: SupabaseClient,
  planId: string,
): Promise<{ plan: ContentPlan; items: ContentPlanItem[] }> {
  const { data: planData, error: planError } = await supabase
    .from('content_plans')
    .select('*')
    .eq('id', planId)
    .single()
  if (planError) throw new Error(planError.message)

  const { data: itemsData, error: itemsError } = await supabase
    .from('content_plan_items')
    .select('*')
    .eq('plan_id', planId)
    .order('sort_order', { ascending: true })
  if (itemsError) throw new Error(itemsError.message)

  return {
    plan: toPlan(planData as PlanRow),
    items: (itemsData ?? []).map(r => toPlanItem(r as PlanItemRow)),
  }
}

export async function insertPlanItems(
  supabase: SupabaseClient,
  planId: string,
  items: Omit<ContentPlanItem, 'id' | 'planId' | 'contentItemId' | 'generatedAssets' | 'productionApproved'>[],
): Promise<ContentPlanItem[]> {
  const rows = items.map((item, i) => ({
    plan_id: planId,
    temporality: item.temporality,
    scheduled_date: item.scheduledDate,
    funnel_stage: item.funnelStage,
    objective: item.objective,
    idea: item.idea,
    format: item.format,
    channel: item.channel,
    kpi: item.kpi,
    benchmark_reference: item.benchmarkReference,
    main_message: item.mainMessage,
    cta: item.cta,
    observations: item.observations,
    status: 'draft',
    sort_order: i,
    raw_ideas: item.rawIdeas ?? null,
    selected_idea_type: item.selectedIdeaType ?? null,
    content_category: item.contentCategory ?? null,
    production_type: item.productionType ?? null,
    conversion_channel: item.conversionChannel ?? null,
    target_audience: item.targetAudience ?? null,
  }))

  const { data, error } = await supabase
    .from('content_plan_items')
    .insert(rows)
    .select()
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => toPlanItem(r as PlanItemRow))
}

export async function updatePlan(
  supabase: SupabaseClient,
  planId: string,
  patch: {
    strategicBrief?: string | null
    channelMix?: string[]
    funnelFocus?: string
    funnelDistribution?: FunnelDistribution | null
    piecesCount?: number
    totalPieces?: number | null
    status?: ContentPlan['status']
  },
): Promise<ContentPlan> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.strategicBrief !== undefined) update.strategic_brief = patch.strategicBrief
  if (patch.channelMix !== undefined) update.channel_mix = patch.channelMix
  if (patch.funnelFocus !== undefined) update.funnel_focus = patch.funnelFocus
  if (patch.funnelDistribution !== undefined) update.funnel_distribution = patch.funnelDistribution
  if (patch.piecesCount !== undefined) update.pieces_count = patch.piecesCount
  if (patch.totalPieces !== undefined) update.total_pieces = patch.totalPieces
  if (patch.status !== undefined) update.status = patch.status

  const { data, error } = await supabase
    .from('content_plans')
    .update(update)
    .eq('id', planId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toPlan(data as PlanRow)
}

export async function updatePlanItem(
  supabase: SupabaseClient,
  itemId: string,
  patch: Partial<Omit<ContentPlanItem, 'id' | 'planId'>>,
): Promise<ContentPlanItem> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.temporality !== undefined) update.temporality = patch.temporality
  if (patch.scheduledDate !== undefined) update.scheduled_date = patch.scheduledDate
  if (patch.funnelStage !== undefined) update.funnel_stage = patch.funnelStage
  if (patch.objective !== undefined) update.objective = patch.objective
  if (patch.idea !== undefined) update.idea = patch.idea
  if (patch.format !== undefined) update.format = patch.format
  if (patch.channel !== undefined) update.channel = patch.channel
  if (patch.kpi !== undefined) update.kpi = patch.kpi
  if (patch.benchmarkReference !== undefined) update.benchmark_reference = patch.benchmarkReference
  if (patch.mainMessage !== undefined) update.main_message = patch.mainMessage
  if (patch.cta !== undefined) update.cta = patch.cta
  if (patch.observations !== undefined) update.observations = patch.observations
  if (patch.status !== undefined) update.status = patch.status
  if (patch.rawIdeas !== undefined) update.raw_ideas = patch.rawIdeas
  if (patch.selectedIdeaType !== undefined) update.selected_idea_type = patch.selectedIdeaType
  if (patch.generatedAssets !== undefined) update.generated_assets = patch.generatedAssets
  if (patch.productionApproved !== undefined) update.production_approved = patch.productionApproved
  if (patch.contentCategory !== undefined) update.content_category = patch.contentCategory
  if (patch.productionType !== undefined) update.production_type = patch.productionType
  if (patch.conversionChannel !== undefined) update.conversion_channel = patch.conversionChannel
  if (patch.targetAudience !== undefined) update.target_audience = patch.targetAudience

  const { data, error } = await supabase
    .from('content_plan_items')
    .update(update)
    .eq('id', itemId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toPlanItem(data as PlanItemRow)
}
