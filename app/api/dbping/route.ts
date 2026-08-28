import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Measures real database round-trip time from a deployed function, so the
 * Singapore→Mumbai move can be proved rather than assumed.
 *
 * Deliberately does NOT pin preferredRegion. Nothing else in this app pins a
 * region, so a pinned probe would measure a function that no real request ever
 * runs on. It reports the region it actually landed in instead — which is also
 * how you find out whether the functions are where you think they are. If
 * `region` comes back as anything other than bom1, the database move buys less
 * than expected and the Vercel project's default region is the thing to fix
 * first.
 *
 * Gated behind CRON_SECRET: it holds a service-role client and leaks infra
 * detail, neither of which belongs on an open endpoint.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'missing SUPABASE_URL or key' }, { status: 500 })
  }

  const sb = createClient(url, key, { auth: { persistSession: false } })

  // Warm the pool first. The first query pays TLS negotiation and connection
  // setup, which is real but is not the per-query tax we are trying to measure.
  const warm = await sb.from('clients').select('id').limit(1)
  if (warm.error) {
    return NextResponse.json({ error: warm.error.message }, { status: 500 })
  }

  const samples: number[] = []
  for (let i = 0; i < 25; i++) {
    const t0 = performance.now()
    const { error } = await sb.from('clients').select('id').limit(1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    samples.push(performance.now() - t0)
  }
  samples.sort((a, b) => a - b)
  const at = (p: number) => +samples[Math.min(samples.length - 1, Math.floor(p * samples.length))].toFixed(2)

  return NextResponse.json({
    region: process.env.VERCEL_REGION ?? 'local',
    // The project ref is the fastest way to confirm which database answered.
    project: url.replace(/^https:\/\/([^.]+).*$/, '$1'),
    n: samples.length,
    min: +samples[0].toFixed(2),
    p50: at(0.5),
    p95: at(0.95),
    max: +samples[samples.length - 1].toFixed(2),
  })
}
