import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'
import type { UserRole } from '@/types/domain'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string; memberId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { memberId } = await params
    const body = await req.json()
    const role: UserRole = body.role

    const validRoles: UserRole[] = ['admin', 'product_owner', 'content']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('brand_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ brandId: string; memberId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { memberId } = await params
    const db = createAdminClient()
    const { error } = await db.from('brand_members').delete().eq('id', memberId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: { id: memberId } })
  } catch (err) {
    return errorResponse(err)
  }
}
