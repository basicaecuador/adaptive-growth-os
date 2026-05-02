import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

type CookieItem = { name: string; value: string; options: CookieOptions }

export async function getServerUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list: CookieItem[]) {
          list.forEach(({ name, value, options }) =>
            // CookieOptions (cookie pkg) and ResponseCookie (edge-runtime) share the same shape
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cookieStore.set(name, value, options as any)
          )
        },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
