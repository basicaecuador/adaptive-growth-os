import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// POST /api/ai/feedback — implemented in FASE 3
// Receives feedback and triggers rule extraction via feedback-agent
export async function POST(_req: NextRequest) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented — FASE 3' } }, { status: 501 })
}
