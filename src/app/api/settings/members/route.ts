import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()

    // Find the user's organization
    const { data: membership } = await db
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ data: { org: null, members: [] } })
    }

    const orgId = membership.organization_id

    // Get org info
    const { data: org } = await db
      .from('organizations')
      .select('id, name, slug')
      .eq('id', orgId)
      .single()

    // Get all org members
    const { data: members, error } = await db
      .from('organization_members')
      .select('id, user_id, role, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    // Fetch emails via admin
    const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
    const emailMap = new Map(users.map(u => [u.id, { email: u.email ?? '', name: u.user_metadata?.full_name ?? '' }]))

    const enriched = (members ?? []).map(m => ({
      id: m.id,
      userId: m.user_id,
      email: emailMap.get(m.user_id)?.email ?? '—',
      name: emailMap.get(m.user_id)?.name ?? '',
      role: m.role,
      joinedAt: m.created_at,
    }))

    // Get brand members for this org
    const { data: brands } = await db
      .from('brands')
      .select('id, name')
      .eq('organization_id', orgId)

    const brandIds = (brands ?? []).map(b => b.id)
    const brandMap = new Map((brands ?? []).map(b => [b.id, b.name]))

    const { data: brandMembers } = await db
      .from('brand_members')
      .select('id, brand_id, user_id, email, role')
      .in('brand_id', brandIds.length ? brandIds : ['00000000-0000-0000-0000-000000000000'])

    const brandMembersEnriched = (brandMembers ?? []).map(bm => ({
      id: bm.id,
      brandId: bm.brand_id,
      brandName: brandMap.get(bm.brand_id) ?? '—',
      userId: bm.user_id,
      email: bm.email,
      role: bm.role,
    }))

    return NextResponse.json({ data: { org, members: enriched, brandMembers: brandMembersEnriched } })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { email, role } = body as { email: string; role: string }

    if (!email || !role) {
      return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 })
    }

    const db = createAdminClient()

    const { data: membership } = await db
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })

    const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
    const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!found) return NextResponse.json({ error: 'Usuario no encontrado en el sistema' }, { status: 404 })

    const { data, error } = await db
      .from('organization_members')
      .upsert(
        { organization_id: membership.organization_id, user_id: found.id, role },
        { onConflict: 'organization_id,user_id' },
      )
      .select('id, user_id, role, created_at')
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({
      data: {
        id: data.id,
        userId: data.user_id,
        email: found.email,
        name: found.user_metadata?.full_name ?? '',
        role: data.role,
        joinedAt: data.created_at,
      },
    }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
