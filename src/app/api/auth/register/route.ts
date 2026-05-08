import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/utils/errors'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body as {
      name: string
      email: string
      password: string
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const db = createAdminClient()

    // Create user (skip email confirmation for controlled B2B env)
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) {
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already been registered') ||
        authError.message.includes('already exists')
      ) {
        return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
      }
      throw new Error(authError.message)
    }

    const userId = authData.user.id

    // Auto-join the first (main) organization with 'content' role
    const { data: orgs } = await db
      .from('organizations')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)

    const orgId = orgs?.[0]?.id
    if (orgId) {
      await db
        .from('organization_members')
        .upsert(
          { organization_id: orgId, user_id: userId, role: 'content' },
          { onConflict: 'organization_id,user_id' },
        )
    }

    return NextResponse.json({ data: { userId } }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
