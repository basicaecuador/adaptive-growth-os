import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// POST /api/webhooks — for external integrations (future phases)
// Excluded from auth middleware matcher
export async function POST(_req: NextRequest) {
  return NextResponse.json({ received: true })
}
