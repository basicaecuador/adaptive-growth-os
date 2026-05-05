import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server-client'

export const maxDuration = 30

export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = process.env.HIGGSFIELD_API_KEY ?? ''
  const colonIdx = raw.indexOf(':')
  const keyId = colonIdx !== -1 ? raw.slice(0, colonIdx) : '(sin colon)'
  const secret = colonIdx !== -1 ? raw.slice(colonIdx + 1) : raw

  const results: Record<string, unknown> = {
    keyFormat: colonIdx !== -1 ? 'KEY_ID:SECRET' : 'single value',
    keyIdPrefix: keyId.slice(0, 8) + '...',
    secretPrefix: secret.slice(0, 8) + '...',
  }

  const BASE = 'https://platform.higgsfield.ai'

  // Try 1: hf-api-key + hf-secret
  try {
    const r = await fetch(`${BASE}/v1/motions`, {
      headers: { 'hf-api-key': keyId, 'hf-secret': secret },
    })
    const body = await r.text()
    results['hf-headers'] = { status: r.status, body: body.slice(0, 300) }
  } catch (e) { results['hf-headers'] = { error: String(e) } }

  // Try 2: Authorization: Key KEY_ID:SECRET
  try {
    const r = await fetch(`${BASE}/v1/motions`, {
      headers: { Authorization: `Key ${raw}` },
    })
    const body = await r.text()
    results['auth-key'] = { status: r.status, body: body.slice(0, 300) }
  } catch (e) { results['auth-key'] = { error: String(e) } }

  // Try 3: Authorization: Bearer SECRET
  try {
    const r = await fetch(`${BASE}/v1/motions`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const body = await r.text()
    results['bearer-secret'] = { status: r.status, body: body.slice(0, 300) }
  } catch (e) { results['bearer-secret'] = { error: String(e) } }

  // Try 4: Authorization: Bearer full raw key
  try {
    const r = await fetch(`${BASE}/v1/motions`, {
      headers: { Authorization: `Bearer ${raw}` },
    })
    const body = await r.text()
    results['bearer-raw'] = { status: r.status, body: body.slice(0, 300) }
  } catch (e) { results['bearer-raw'] = { error: String(e) } }

  return NextResponse.json(results)
}
