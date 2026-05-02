import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// POST /api/ai/generate — implemented in FASE 2
// Direct AI generation endpoint with streaming support
export async function POST(_req: NextRequest) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented — FASE 2' } }, { status: 501 })
}
