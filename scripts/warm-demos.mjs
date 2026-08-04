/**
 * Pre-cache (warm) every matched exercise demo into Blob — one ExerciseDB
 * request each, so it fits the free plan's 690/month quota (353 matched < 690).
 *
 * WHY: the app fetches each GIF lazily on first view and caches it to Blob
 * forever. This script just does that proactively for all matched exercises in
 * one pass, so demos are instant from day one. It writes to the SAME Blob path
 * the /api/exercise-gif route reads (exercise-demos/<id>.gif), so once warmed,
 * the route serves from Blob and never calls ExerciseDB again.
 *
 * SAFE: skips demos already cached, and STOPS immediately on HTTP 429 (quota),
 * so a re-run after the monthly reset continues where it left off — no waste.
 *
 * RUN (only when you have quota — i.e. after the monthly reset, or on a paid
 * tier). Check remaining quota first: the ExerciseDB page shows it, or just run
 * and it will stop cleanly if empty.
 *   node --env-file=.env.local scripts/warm-demos.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { get, put } from '@vercel/blob'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const KEY = process.env.RAPIDAPI_KEY
const HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com'
if (!SUPA_URL || !SUPA_KEY || !KEY || !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('✗ Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAPIDAPI_KEY, BLOB_READ_WRITE_TOKEN in .env.local')
  process.exit(1)
}

const db = createClient(SUPA_URL, SUPA_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function alreadyCached(pathname) {
  try { const b = await get(pathname, { access: 'private' }); return !!b } catch { return false }
}

async function main() {
  const { data: rows } = await db
    .from('exercises')
    .select('id, name, demo_url')
    .like('demo_url', '/api/exercise-gif%')
  const list = (rows || []).map((r) => ({ ...r, edbId: new URL('http://x' + r.demo_url).searchParams.get('id') })).filter((r) => r.edbId)
  console.log(`\nWarming ${list.length} matched demos into Blob (1 request each)…\n`)

  let cached = 0, done = 0, failed = 0
  for (const r of list) {
    const pathname = `exercise-demos/${r.edbId}.gif`
    if (await alreadyCached(pathname)) { cached++; continue }
    let res
    try { res = await fetch(`https://${HOST}/image?exerciseId=${r.edbId}&resolution=360`, { headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': HOST } }) }
    catch (e) { failed++; console.log(`  ! ${r.name}: ${e.message}`); continue }
    if (res.status === 429) {
      console.log(`\n⏸ Quota reached — stopping cleanly. ${done} newly cached this run.`)
      console.log(`  Re-run after the monthly reset to continue where it left off.\n`)
      break
    }
    const ct = res.headers.get('content-type') || ''
    if (!res.ok || !ct.includes('image')) { failed++; console.log(`  ! ${r.name}: HTTP ${res.status}`); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 500) { failed++; continue }
    try { await put(pathname, buf, { access: 'private', contentType: ct }); done++ }
    catch (e) { failed++; console.log(`  ! ${r.name}: blob ${e.message}`); continue }
    if (done % 20 === 0) process.stdout.write(`\r  cached ${done} new…`)
    await sleep(400) // gentle spacing under the rate limit
  }
  process.stdout.write('\n')
  console.log(`\n── Result ──`)
  console.log(`  newly cached : ${done}`)
  console.log(`  already had  : ${cached}`)
  console.log(`  failed       : ${failed}`)
  console.log(`\nDone. Warmed demos now serve instantly from Blob (no more API calls).\n`)
}

main().catch((e) => { console.error(e); process.exit(1) })
