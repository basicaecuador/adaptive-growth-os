import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/utils/errors'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, orgName, orgSlug } = body as {
      name: string
      email: string
      password: string
      orgName: string
      orgSlug: string
    }

    if (!name || !email || !password || !orgName || !orgSlug) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const db = createAdminClient()

    // Check slug availability
    const { data: existing } = await db
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Ya existe una organización con ese nombre' }, { status: 409 })
    }

    // Create user via admin (skips email confirmation)
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
      }
      throw new Error(authError.message)
    }

    const userId = authData.user.id

    // Create organization
    const { data: org, error: orgError } = await db
      .from('organizations')
      .insert({ name: orgName, slug: orgSlug })
      .select('id')
      .single()

    if (orgError) throw new Error(orgError.message)

    // Add user as admin member
    const { error: memberError } = await db
      .from('organization_members')
      .insert({ organization_id: org.id, user_id: userId, role: 'admin' })

    if (memberError) throw new Error(memberError.message)

    return NextResponse.json({ data: { userId, orgId: org.id } }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
