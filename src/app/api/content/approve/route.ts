import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// POST /api/content/approve — implemented in FASE 3
// Validates state transition before persisting approval
export async function POST(_req: NextRequest) {
  return NextResponse.json({ data: null, error: { message: 'Not implemented — FASE 3' } }, { status: 501 })
}
