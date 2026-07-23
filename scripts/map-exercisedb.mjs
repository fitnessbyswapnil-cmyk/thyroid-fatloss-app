/**
 * Map your exercise library to ExerciseDB's animated GIF demos.
 *
 * ExerciseDB (RapidAPI) ships smooth looping GIFs licensed for use in apps —
 * the MuscleWiki-style "watch the rep" look, legally. This script pulls the
 * whole ExerciseDB catalogue, matches each of YOUR library exercises to it by
 * name, and writes the GIF URL into exercises.demo_url. Your components already
 * prefer demo_url over the old two-photo stills, so demos upgrade automatically.
 *
 * It NEVER deletes your current photos unless you pass --clear-photos, so if a
 * match isn't found the old demo still shows. Safe to re-run.
 *
 * ── SETUP (one time) ─────────────────────────────────────────────────────────
 *  1. Make a free account at https://rapidapi.com
 *  2. Open https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb  → click
 *     "Subscribe to Test" → pick the FREE (Basic) plan.
 *  3. On the endpoints page, copy your "X-RapidAPI-Key".
 *  4. Add it to .env.local:   RAPIDAPI_KEY=your_key_here
 *
 * ── RUN ──────────────────────────────────────────────────────────────────────
 *   # dry run — see how many would match, changes nothing:
 *   node --env-file=.env.local scripts/map-exercisedb.mjs --dry
 *
 *   # apply — fill demo_url for every matched exercise:
 *   node --env-file=.env.local scripts/map-exercisedb.mjs
 *
 *   # apply AND null out the old start/end photos on matched rows:
 *   node --env-file=.env.local scripts/map-exercisedb.mjs --clear-photos
 */
import { createClient } from '@supabase/supabase-js'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const RAPID_KEY = process.env.RAPIDAPI_KEY
const RAPID_HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com'

const DRY = process.argv.includes('--dry')
const CLEAR = process.argv.includes('--clear-photos')

if (!SUPA_URL || !SUPA_KEY) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — run with --env-file=.env.local')
  process.exit(1)
}
if (!RAPID_KEY) {
  console.error('✗ Missing RAPIDAPI_KEY in .env.local. See the setup steps at the top of this file.')
  process.exit(1)
}

const db = createClient(SUPA_URL, SUPA_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// Normalise a name for matching: lowercase, drop punctuation & filler words,
// collapse whitespace. "Barbell Bench Press - Medium Grip" -> "barbell bench press medium grip"
const STOP = new Set(['the', 'a', 'with', 'and', 'to', 'of', 'on'])
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .join(' ')
    .trim()
const tokens = (s) => new Set(norm(s).split(' ').filter(Boolean))

// Jaccard-ish overlap so "bench press" still matches "barbell bench press".
function overlap(a, b) {
  const A = tokens(a), B = tokens(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / Math.max(A.size, B.size)
}

async function fetchExerciseDb() {
  const out = []
  const limit = 200
  for (let offset = 0; ; offset += limit) {
    const res = await fetch(`https://${RAPID_HOST}/exercises?limit=${limit}&offset=${offset}`, {
      headers: { 'X-RapidAPI-Key': RAPID_KEY, 'X-RapidAPI-Host': RAPID_HOST },
    })
    if (res.status === 401 || res.status === 403) {
      console.error(`✗ ExerciseDB rejected the key (HTTP ${res.status}). Check RAPIDAPI_KEY and that you subscribed to the free plan.`)
      process.exit(1)
    }
    if (!res.ok) {
      console.error(`✗ ExerciseDB request failed: HTTP ${res.status}`)
      process.exit(1)
    }
    const page = await res.json()
    if (!Array.isArray(page) || page.length === 0) break
    out.push(...page)
    process.stdout.write(`\r  fetched ${out.length} ExerciseDB exercises…`)
    if (page.length < limit) break
  }
  process.stdout.write('\n')
  return out
}

async function main() {
  console.log(`\nThyroWell → ExerciseDB demo mapper  ${DRY ? '(dry run)' : ''}${CLEAR ? ' [will clear old photos on matches]' : ''}`)

  const edb = await fetchExerciseDb()
  if (!edb.length) {
    console.error('✗ ExerciseDB returned no exercises.')
    process.exit(1)
  }
  // Index by exact normalised name for O(1) hits; keep the array for fuzzy fallback.
  const byName = new Map()
  for (const e of edb) if (e.gifUrl) byName.set(norm(e.name), e)

  const { data: lib, error } = await db.from('exercises').select('id, name, demo_url')
  if (error) { console.error('✗ Could not read exercises:', error.message); process.exit(1) }
  console.log(`  ${lib.length} exercises in your library\n`)

  let exact = 0, fuzzy = 0, miss = 0, updated = 0
  const misses = []

  for (const row of lib) {
    let match = byName.get(norm(row.name))
    if (match) exact++
    else {
      // Fuzzy: best token overlap over a confidence threshold.
      let best = null, bestScore = 0
      for (const e of edb) {
        if (!e.gifUrl) continue
        const s = overlap(row.name, e.name)
        if (s > bestScore) { bestScore = s; best = e }
      }
      if (best && bestScore >= 0.6) { match = best; fuzzy++ }
    }

    if (!match) { miss++; misses.push(row.name); continue }

    if (!DRY) {
      const patch = { demo_url: match.gifUrl, updated_at: new Date().toISOString() }
      if (CLEAR) { patch.image_start = null; patch.image_end = null }
      const { error: uerr } = await db.from('exercises').update(patch).eq('id', row.id)
      if (uerr) { console.error(`  ! ${row.name}: ${uerr.message}`); continue }
    }
    updated++
  }

  console.log(`\n── Result ──`)
  console.log(`  exact matches : ${exact}`)
  console.log(`  fuzzy matches : ${fuzzy}`)
  console.log(`  no match      : ${miss}  (kept their existing photo demo)`)
  console.log(`  ${DRY ? 'would update' : 'updated'}   : ${updated} exercises with animated GIFs`)
  if (misses.length) {
    console.log(`\n  Unmatched (first 25): ${misses.slice(0, 25).join(', ')}${misses.length > 25 ? ' …' : ''}`)
  }
  console.log(DRY ? '\nDry run only — nothing was written. Re-run without --dry to apply.\n' : '\nDone.\n')
}

main().catch((e) => { console.error(e); process.exit(1) })
