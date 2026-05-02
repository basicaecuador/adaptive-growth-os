import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listOrganizationsForUser, createOrganization } from '@/services/organizations.service'
import { errorResponse } from '@/lib/utils/errors'
import { getServerUser } from '@/lib/supabase/server-client'

export async function GET(_req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()
    const orgs = await listOrganizationsForUser(db, user.id)
    return NextResponse.json({ data: orgs })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const db = createAdminClient()
    const org = await createOrganization(db, user.id, body)
    return NextResponse.json({ data: org }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
