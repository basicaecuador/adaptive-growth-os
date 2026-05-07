import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { memberId } = await params
    const { role } = await req.json()

    const db = createAdminClient()
    const { data, error } = await db
      .from('organization_members')
      .update({ role })
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
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { memberId } = await params
    const db = createAdminClient()
    const { error } = await db.from('organization_members').delete().eq('id', memberId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: { id: memberId } })
  } catch (err) {
    return errorResponse(err)
  }
}
