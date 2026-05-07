import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'
import type { BrandMember, UserRole } from '@/types/domain'

function toMember(row: Record<string, unknown>): BrandMember {
  return {
    id: row.id as string,
    brandId: row.brand_id as string,
    userId: row.user_id as string,
    email: row.email as string,
    role: row.role as UserRole,
    invitedBy: (row.invited_by as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    const db = createAdminClient()
    const { data, error } = await db
      .from('brand_members')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: (data ?? []).map(toMember) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    const body = await req.json()
    const { email, role } = body as { email: string; role: UserRole }

    if (!email || !role) {
      return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 })
    }

    const validRoles: UserRole[] = ['admin', 'product_owner', 'content']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    const db = createAdminClient()

    const { data: { users }, error: authError } = await db.auth.admin.listUsers({ perPage: 1000 })
    const foundUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (authError || !foundUser) {
      return NextResponse.json({ error: 'Usuario no encontrado en el sistema' }, { status: 404 })
    }

    const { data, error } = await db
      .from('brand_members')
      .upsert(
        {
          brand_id: brandId,
          user_id: foundUser.id,
          email: foundUser.email ?? email,
          role,
          invited_by: user.id,
        },
        { onConflict: 'brand_id,user_id' },
      )
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: toMember(data as Record<string, unknown>) }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
