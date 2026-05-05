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

    const res = await fetch(`https://platform.higgsfield.ai/v1/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.message ?? err?.detail ?? `Error Higgsfield status (HTTP ${res.status})`)
    }

    const result = await res.json()

    // Normalize status: queued | in_progress | completed | failed | nsfw
    const rawStatus: string = result.status ?? result.state ?? result.jobSet?.status ?? 'pending'
    const status = rawStatus === 'completed' || rawStatus === 'succeeded' ? 'completed'
      : rawStatus === 'failed' || rawStatus === 'nsfw' ? 'failed'
      : rawStatus

    const videoUrl: string | null =
      result.video_url ??
      result.output?.video_url ??
      result.outputs?.[0]?.url ??
      result.result?.url ??
      result.jobSet?.jobs?.[0]?.results?.raw?.url ??
      null

    return NextResponse.json({
      data: {
        jobId,
        status,
        videoUrl,
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
