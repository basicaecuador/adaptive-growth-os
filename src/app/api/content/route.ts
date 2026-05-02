import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { listContentByBrand } from '@/services/content.service'
import { errorResponse } from '@/lib/utils/errors'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const brandId = req.nextUrl.searchParams.get('brand_id')
    if (!brandId) return NextResponse.json({ error: 'brand_id required' }, { status: 400 })

    const db = createAdminClient()
    const items = await listContentByBrand(db, brandId)
    return NextResponse.json({ data: items })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: 'Use /api/content/generate to create content' }, { status: 400 })
}
