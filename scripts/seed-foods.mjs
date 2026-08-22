/**
 * Import data/foods-indian.csv into the food library, skipping any food whose
 * name already exists (case-insensitive).
 *
 * The in-app CSV importer does a plain insert with no dedupe, so re-importing
 * there would silently duplicate every existing food. This is safe to re-run.
 *
 *   node --env-file=.env.local scripts/seed-foods.mjs        # dry run
 *   node --env-file=.env.local scripts/seed-foods.mjs --apply
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CSV = join(HERE, '..', 'data', 'foods-indian.csv')
const APPLY = process.argv.includes('--apply')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error('✗ Missing Supabase env (run with --env-file=.env.local)')
  process.exit(1)
}

/** Minimal CSV parser that respects quoted fields containing commas. */
function parseLine(line) {
  const out = []
  let cur = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ } else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

const lines = readFileSync(CSV, 'utf8').trim().split('\n')
const headers = parseLine(lines[0])
const rows = lines.slice(1).map((l) => Object.fromEntries(parseLine(l).map((v, i) => [headers[i], v])))

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: existing, error: readErr } = await db.from('foods').select('name')
if (readErr) { console.error('✗', readErr.message); process.exit(1) }
const have = new Set((existing || []).map((f) => f.name.trim().toLowerCase()))

const num = (v) => (v === '' || v === undefined ? null : Number(v))
const fresh = rows
  .filter((r) => r.name && !have.has(r.name.trim().toLowerCase()))
  .map((r) => ({
    name: r.name,
    portion: r.portion || '1 serving',
    calories: num(r.calories),
    protein: num(r.protein),
    carbs: num(r.carbs),
    fats: num(r.fats),
    is_veg: String(r.is_veg).toLowerCase() !== 'false',
    tags: r.tags || null,
  }))

const skipped = rows.length - fresh.length
console.log(`CSV rows: ${rows.length}`)
console.log(`already in library (skipped): ${skipped}`)
console.log(`new to import: ${fresh.length}`)

if (!APPLY) {
  console.log('\nDry run — nothing written. Re-run with --apply to import.')
  process.exit(0)
}

// Insert in chunks so one oversized request can't fail the whole import.
let inserted = 0
for (let i = 0; i < fresh.length; i += 100) {
  const chunk = fresh.slice(i, i + 100)
  const { error } = await db.from('foods').insert(chunk)
  if (error) { console.error('✗ chunk failed:', error.message); process.exit(1) }
  inserted += chunk.length
}

const { count } = await db.from('foods').select('*', { count: 'exact', head: true })
console.log(`\n✓ Imported ${inserted}. Library now has ${count} foods.`)
