import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

type CookieItem = { name: string; value: string; options: CookieOptions }

const AGENCY_DOMAIN = '@basica.la'

async function ensureOrgMembership(userId: string, email: string) {
  try {
    const db = createAdminClient()

    // Skip if agency member — layout handles that separately
    if (email.endsWith(AGENCY_DOMAIN)) return

    // Check if already a member anywhere
    const { data: existing } = await db
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (existing) return

    const { data: brandMember } = await db
      .from('brand_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (brandMember) return

    // New user — auto-join main org with 'content' role
    const { data: orgs } = await db
      .from('organizations')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)

    const orgId = orgs?.[0]?.id
    if (!orgId) return

    await db
      .from('organization_members')
      .upsert(
        { organization_id: orgId, user_id: userId, role: 'content' },
        { onConflict: 'organization_id,user_id' },
      )
  } catch {
    // Non-blocking
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const origin = url.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(list: CookieItem[]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options as any))
          },
        },
      },
    )
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user) {
      await ensureOrgMembership(data.user.id, data.user.email ?? '')
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
