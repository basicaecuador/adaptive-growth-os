import type { SupabaseClient } from '@supabase/supabase-js'
import type { Brand, BrandSetup } from '@/types/domain'
import type { CreateBrandRequest, UpdateBrandRequest } from '@/types/api'

type BrandRow = {
  id: string
  organization_id: string
  name: string
  slug: string
  is_active: boolean
  logo_url: string | null
  font_url: string | null
  primary_color: string | null
  created_at: string
  updated_at: string
}

function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    logoUrl: row.logo_url ?? null,
    fontUrl: row.font_url ?? null,
    primaryColor: row.primary_color ?? '#000000',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getBrandById(
  supabase: SupabaseClient,
  id: string,
): Promise<Brand> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return toBrand(data as BrandRow)
}

export async function listBrandsByOrganization(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => toBrand(r as BrandRow))
}

export async function createBrand(
  supabase: SupabaseClient,
  input: CreateBrandRequest,
): Promise<Brand> {
  const slug = input.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const { data, error } = await supabase
    .from('brands')
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      slug,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toBrand(data as BrandRow)
}

export async function updateBrand(
  supabase: SupabaseClient,
  id: string,
  input: UpdateBrandRequest,
): Promise<Brand> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) patch.name = input.name
  if (input.isActive !== undefined) patch.is_active = input.isActive

  const { data, error } = await supabase
    .from('brands')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toBrand(data as BrandRow)
}

type BrandDetailRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  font_url: string | null
  primary_color: string | null
  voice: string | null
  tone: string | null
  target_audience: string | null
  value_proposition: string | null
  content_pillars: string[] | null
  restrictions: string[] | null
  updated_at: string
}

function toSetup(row: BrandDetailRow): BrandSetup {
  return {
    brandId: row.id,
    voice: row.voice ?? '',
    tone: row.tone ?? '',
    targetAudience: row.target_audience ?? '',
    valueProposition: row.value_proposition ?? '',
    contentPillars: row.content_pillars ?? [],
    restrictions: row.restrictions ?? [],
    updatedAt: new Date(row.updated_at),
  }
}

export async function getBrandWithSetup(
  supabase: SupabaseClient,
  brandId: string,
): Promise<{ id: string; name: string; slug: string; logoUrl: string | null; fontUrl: string | null; primaryColor: string } & BrandSetup> {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url, font_url, primary_color, voice, tone, target_audience, value_proposition, content_pillars, restrictions, updated_at')
    .eq('id', brandId)
    .single()
  if (error) throw new Error(error.message)
  const row = data as BrandDetailRow
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url ?? null,
    fontUrl: row.font_url ?? null,
    primaryColor: row.primary_color ?? '#000000',
    ...toSetup(row),
  }
}

export async function getBrandSetup(
  supabase: SupabaseClient,
  brandId: string,
): Promise<BrandSetup | null> {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, voice, tone, target_audience, value_proposition, content_pillars, restrictions, updated_at')
    .eq('id', brandId)
    .single()
  if (error) throw new Error(error.message)
  return toSetup(data as BrandDetailRow)
}

export async function upsertBrandSetup(
  supabase: SupabaseClient,
  setup: BrandSetup,
): Promise<BrandSetup> {
  const { data, error } = await supabase
    .from('brands')
    .update({
      voice: setup.voice,
      tone: setup.tone,
      target_audience: setup.targetAudience,
      value_proposition: setup.valueProposition,
      content_pillars: setup.contentPillars,
      restrictions: setup.restrictions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', setup.brandId)
    .select('id, name, slug, voice, tone, target_audience, value_proposition, content_pillars, restrictions, updated_at')
    .single()
  if (error) throw new Error(error.message)
  return toSetup(data as BrandDetailRow)
}
