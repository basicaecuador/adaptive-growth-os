import type { SupabaseClient } from '@supabase/supabase-js'
import type { Organization } from '@/types/domain'
import type { CreateOrganizationRequest } from '@/types/api'

type OrgRow = {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

function toOrganization(row: OrgRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getOrganizationById(
  supabase: SupabaseClient,
  id: string,
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return toOrganization(data as OrgRow)
}

export async function listOrganizationsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organizations(*)')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return (data ?? [])
    .map((row: { organizations: unknown }) => row.organizations as OrgRow)
    .filter(Boolean)
    .map(toOrganization)
}

export async function createOrganization(
  supabase: SupabaseClient,
  userId: string,
  input: CreateOrganizationRequest,
): Promise<Organization> {
  const slug = input.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: input.name, slug })
    .select()
    .single()
  if (orgError) throw new Error(orgError.message)

  await supabase.from('organization_members').insert({
    organization_id: (org as OrgRow).id,
    user_id: userId,
    role: 'owner',
  })

  return toOrganization(org as OrgRow)
}

export async function deleteOrganization(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('organizations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
