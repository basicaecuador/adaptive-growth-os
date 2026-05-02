import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    const formData = await req.formData()
    const file = formData.get('font') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const db = createAdminClient()
    await db.storage.createBucket('media', { public: true }).catch(() => {})

    const ext = file.name.split('.').pop() ?? 'ttf'
    const path = `brands/${brandId}/font.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await db.storage
      .from('media')
      .upload(path, buffer, { contentType: file.type || 'font/truetype', upsert: true })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(path)

    const { error: updateError } = await db
      .from('brands')
      .update({ font_url: publicUrl })
      .eq('id', brandId)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ data: { fontUrl: publicUrl } })
  } catch (err) {
    return errorResponse(err)
  }
}
