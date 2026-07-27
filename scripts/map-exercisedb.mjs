/**
 * Map your exercise library to ExerciseDB's animated GIF demos — self-hosted.
 *
 * ExerciseDB (RapidAPI) serves smooth looping GIFs licensed for use in apps —
 * the MuscleWiki-style "watch the rep" look, legally. This version:
 *   1. Pulls the whole ExerciseDB catalogue (10/page on the free plan) ONCE and
 *      caches it to scripts/.cache-exercisedb.json so re-runs cost no quota.
 *   2. Matches each of YOUR library exercises to it by name (exact + fuzzy).
 *   3. Downloads each matched GIF and re-uploads it to YOUR Vercel Blob, then
 *      stores that public Blob URL in exercises.demo_url.
 *
 * Self-hosting means: your API key never reaches the browser, client traffic
 * never burns your ExerciseDB quota, and demos load fast from your own storage.
 * Existing photo demos are kept as a fallback (only removed with --clear-photos).
 * The script is RESUMABLE — it skips exercises that already have a demo_url, so
 * if you hit the monthly quota you can finish next month with another run.
 *
 * ── SETUP ────────────────────────────────────────────────────────────────────
 *   .env.local needs (both already present in your project):
 *     RAPIDAPI_KEY=...              (from rapidapi.com → ExerciseDB → Subscribe)
 *     BLOB_READ_WRITE_TOKEN=...     (your Vercel Blob token)
 *     NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *
 * ── RUN ──────────────────────────────────────────────────────────────────────
 *   # dry run — match only, downloads/writes nothing:
 *   node --env-file=.env.local scripts/map-exercisedb.mjs --dry
 *
 *   # apply — download matched GIFs to Blob + fill demo_url:
 *   node --env-file=.env.local scripts/map-exercisedb.mjs
 *
 *   # apply AND null the old start/end photos on matched rows:
 *   node --env-file=.env.local scripts/map-exercisedb.mjs --clear-photos
 *
 *   # re-fetch the catalogue from scratch (ignore the cache):
 *   node --env-file=.env.local scripts/map-exercisedb.mjs --refresh
 */
import { createClient } from '@supabase/supabase-js'
import { put } from '@vercel/blob'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache-exercisedb.json')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const RAPID_KEY = process.env.RAPIDAPI_KEY
const RAPID_HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com'
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

const DRY = process.argv.includes('--dry')
const CLEAR = process.argv.includes('--clear-photos')
const REFRESH = process.argv.includes('--refresh')

function need(v, name) { if (!v) { console.error(`✗ Missing ${name} in .env.local`); process.exit(1) } }
need(SUPA_URL, 'NEXT_PUBLIC_SUPABASE_URL'); need(SUPA_KEY, 'SUPABASE_SERVICE_ROLE_KEY'); need(RAPID_KEY, 'RAPIDAPI_KEY')
if (!DRY) need(BLOB_TOKEN, 'BLOB_READ_WRITE_TOKEN')

const db = createClient(SUPA_URL, SUPA_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const H = { 'X-RapidAPI-Key': RAPID_KEY, 'X-RapidAPI-Host': RAPID_HOST }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── name matching ────────────────────────────────────────────────────────────
const STOP = new Set(['the', 'a', 'with', 'and', 'to', 'of', 'on', 'your'])
const norm = (s) =>
  (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).join(' ').trim()
const tokens = (s) => new Set(norm(s).split(' ').filter(Boolean))
function overlap(a, b) {
  const A = tokens(a), B = tokens(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / Math.max(A.size, B.size)
}

// Equipment family — a demo must use the SAME kind of equipment as the plan
// exercise, or the form shown is wrong (a barbell glute bridge is not a
// bodyweight one). Returns a group key, or null when unknown (treated as
// bodyweight-compatible so gentle moves still match).
function equipGroup(raw) {
  const s = (raw || '').toLowerCase()
  if (!s || /body\s*weight|bodyweight|body only|assisted|none|no equipment/.test(s)) return 'bodyweight'
  if (/kettlebell/.test(s)) return 'kettlebell'
  if (/dumbbell/.test(s)) return 'dumbbell'
  if (/resistance band|band/.test(s)) return 'band'
  if (/barbell|ez ?bar|olympic/.test(s)) return 'barbell'
  if (/cable/.test(s)) return 'cable'
  if (/smith|leverage|machine|sled/.test(s)) return 'machine'
  if (/medicine ball|stability ball|exercise ball|bosu|ball/.test(s)) return 'ball'
  if (/foam roll/.test(s)) return 'bodyweight'
  return 'other'
}
// Same family only. Unknown library equipment falls back to bodyweight-compatible.
function equipOk(libEq, edbEq) {
  const a = equipGroup(libEq), b = equipGroup(edbEq)
  if (a === b) return true
  // A plan exercise with no/unknown equipment is fine paired with a bodyweight demo.
  if ((a === 'other' || a === 'bodyweight') && b === 'bodyweight') return true
  return false
}

// ── fetch full catalogue (10/page free-plan cap), cached ─────────────────────
async function getCatalogue() {
  if (!REFRESH && existsSync(CACHE)) {
    const cached = JSON.parse(readFileSync(CACHE, 'utf8'))
    if (Array.isArray(cached) && cached.length) {
      console.log(`  using cached catalogue: ${cached.length} exercises  (delete scripts/.cache-exercisedb.json or pass --refresh to re-fetch)`)
      return cached
    }
  }
  const all = []
  const seen = new Set()
  const PAGE = 10 // free plan hard-caps page size at 10
  for (let offset = 0; offset < 2000; offset += PAGE) {
    let res
    try { res = await fetch(`https://${RAPID_HOST}/exercises?limit=${PAGE}&offset=${offset}`, { headers: H }) }
    catch (e) { console.error('\n✗ network error:', e.message); break }
    if (res.status === 429) { console.error(`\n✗ Rate/quota limit hit at offset ${offset}. Cached ${all.length} so far — re-run later to continue.`); break }
    if (res.status === 401 || res.status === 403) { console.error(`\n✗ Key rejected (HTTP ${res.status}). Check RAPIDAPI_KEY + free subscription.`); process.exit(1) }
    if (!res.ok) { console.error(`\n✗ HTTP ${res.status} at offset ${offset}`); break }
    const page = await res.json()
    if (!Array.isArray(page) || page.length === 0) break
    let fresh = 0
    for (const e of page) { if (e && e.id && !seen.has(e.id)) { seen.add(e.id); all.push(e); fresh++ } }
    process.stdout.write(`\r  fetching catalogue… ${all.length}`)
    if (page.length < PAGE || fresh === 0) break
    await sleep(200) // be polite to the free plan
  }
  process.stdout.write('\n')
  if (all.length) writeFileSync(CACHE, JSON.stringify(all))
  return all
}

// ── detect the working GIF image endpoint once ───────────────────────────────
async function resolveGif(id) {
  // Newer ExerciseDB serves the GIF binary from /image; try known shapes.
  const candidates = [
    `/image?exerciseId=${id}&resolution=360`,
    `/image?exerciseId=${id}&resolution=180`,
    `/image?exerciseId=${id}`,
  ]
  for (const path of candidates) {
    try {
      const res = await fetch(`https://${RAPID_HOST}${path}`, { headers: H })
      const ct = res.headers.get('content-type') || ''
      if (res.ok && ct.includes('image')) {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length > 500) return { buf, ct, path }
      }
    } catch { /* try next */ }
  }
  return null
}

async function main() {
  console.log(`\nThyroWell → ExerciseDB demo mapper  ${DRY ? '(dry run)' : ''}${CLEAR ? ' [clears old photos on matches]' : ''}`)

  const edb = await getCatalogue()
  if (!edb.length) { console.error('✗ No ExerciseDB exercises available.'); process.exit(1) }

  const { data: lib, error } = await db.from('exercises').select('id, name, equipment, demo_url')
  if (error) { console.error('✗ Could not read exercises:', error.message); process.exit(1) }
  console.log(`  ${lib.length} exercises in your library\n`)

  // Match by NAME within the SAME equipment family only. Equipment first, then
  // best name overlap — so a bodyweight move can never pick a barbell demo.
  const matches = []
  const misses = []
  for (const row of lib) {
    let best = null, bestScore = 0
    for (const e of edb) {
      if (!e.id || !equipOk(row.equipment, e.equipment)) continue
      const s = overlap(row.name, e.name)
      if (s > bestScore) { bestScore = s; best = e }
    }
    // With equipment already constrained, a 0.5 name overlap is a confident match.
    if (best && bestScore >= 0.5) {
      matches.push({ row, edb: best, kind: bestScore >= 0.999 ? 'exact' : 'good' })
    } else {
      misses.push(row.name)
    }
  }
  const exact = matches.filter((m) => m.kind === 'exact').length
  const good = matches.filter((m) => m.kind === 'good').length
  console.log(`  matched: ${matches.length}  (exact ${exact}, same-equipment ${good}) · no match: ${misses.length}`)

  if (DRY) {
    console.log(`\n  Sample matches (name · equipment):`)
    for (const m of matches.slice(0, 15))
      console.log(`    "${m.row.name}" [${m.row.equipment || '—'}]  →  "${m.edb.name}" [${m.edb.equipment}]`)
    if (misses.length) console.log(`\n  Unmatched (first 20): ${misses.slice(0, 20).join(', ')}${misses.length > 20 ? ' …' : ''}`)
    console.log(`\nDry run — nothing downloaded or written. Re-run without --dry to apply.\n`)
    return
  }

  // Confirm the image endpoint works before looping over everything.
  console.log(`\n  resolving GIF endpoint…`)
  const probe = await resolveGif(matches[0]?.edb.id || '0001')
  if (!probe) {
    console.error(`✗ Could not fetch a GIF from the /image endpoint. Your plan may not include image access, or the endpoint shape differs.`)
    console.error(`  Nothing was written. Tell Claude this failed and it will adjust the endpoint.`)
    process.exit(1)
  }
  console.log(`  ✓ GIF endpoint works (${probe.path.split('?')[0]}, ${(probe.buf.length / 1024).toFixed(0)}KB sample)\n`)

  let done = 0, skipped = 0, failed = 0
  for (const { row, edb: ex } of matches) {
    if (row.demo_url) { skipped++; continue } // resumable: already has a demo
    const got = await resolveGif(ex.id)
    if (!got) { failed++; console.log(`  ! ${row.name}: no GIF`); await sleep(150); continue }
    let url
    try {
      const uploaded = await put(`exercise-demos/${ex.id}.gif`, got.buf, {
        access: 'public', token: BLOB_TOKEN, contentType: 'image/gif', addRandomSuffix: false, allowOverwrite: true,
      })
      url = uploaded.url
    } catch (e) { failed++; console.log(`  ! ${row.name}: blob upload failed — ${e.message}`); continue }

    const patch = { demo_url: url, updated_at: new Date().toISOString() }
    if (CLEAR) { patch.image_start = null; patch.image_end = null }
    const { error: uerr } = await db.from('exercises').update(patch).eq('id', row.id)
    if (uerr) { failed++; console.log(`  ! ${row.name}: db update — ${uerr.message}`); continue }
    done++
    if (done % 10 === 0) process.stdout.write(`\r  uploaded ${done} demos…`)
    await sleep(150)
  }
  process.stdout.write('\n')

  console.log(`\n── Result ──`)
  console.log(`  new demos uploaded : ${done}`)
  console.log(`  already had a demo : ${skipped}`)
  console.log(`  failed             : ${failed}`)
  console.log(`  no ExerciseDB match: ${misses.length}  (kept their photo demo)`)
  console.log(`\nDone. Reload the app to see the animated GIF demos.\n`)
}

main().catch((e) => { console.error(e); process.exit(1) })
