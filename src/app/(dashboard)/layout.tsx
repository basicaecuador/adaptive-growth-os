import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AppSidebar } from '@/components/layout/app-sidebar'
import type { Database } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

const AGENCY_DOMAIN = '@basica.la'

async function ensureAgencyMembership(userId: string) {
  try {
    const db = createAdminClient()

    const { data: orgs } = await db
      .from('organizations')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)

    const orgId = orgs?.[0]?.id
    if (!orgId) return

    const { data: existing } = await db
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      await db.from('organization_members').insert({
        organization_id: orgId,
        user_id: userId,
        role: 'admin',
      })
    }
  } catch {
    // Non-blocking — layout renders even if this fails
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (user.email?.endsWith(AGENCY_DOMAIN)) {
    await ensureAgencyMembership(user.id)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar userEmail={user.email} />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
