import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'
import { errorResponse } from '@/lib/utils/errors'

export const maxDuration = 30

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobId } = await params
    const apiKey = process.env.HIGGSFIELD_API_KEY
    if (!apiKey) throw new Error('HIGGSFIELD_API_KEY no configurada')

    const res = await fetch(`https://cloud.higgsfield.ai/v1/generations/${jobId}`, {
      headers: { Authorization: `Key ${apiKey}` },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.message ?? `Error Higgsfield (HTTP ${res.status})`)
    }

    const result = await res.json()

    // Normalize status across Higgsfield response formats
    const status: string = result.status ?? result.state ?? 'pending'
    const videoUrl: string | null =
      result.video_url ??
      result.output?.video_url ??
      result.outputs?.[0]?.url ??
      result.result?.url ??
      null

    return NextResponse.json({
      data: {
        jobId,
        status,
        videoUrl,
        raw: result,
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
