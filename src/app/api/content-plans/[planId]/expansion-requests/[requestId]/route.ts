import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; requestId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { requestId } = await params
    const body = await req.json()
    const status: 'approved' | 'rejected' = body.status

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('content_expansion_requests')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (err) {
    return errorResponse(err)
  }
}
