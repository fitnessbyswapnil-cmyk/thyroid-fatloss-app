/**
 * Seed / refresh the education library from data/lessons.ts.
 *
 * Idempotent: upserts on `slug`, so editing a lesson's text and re-running
 * updates it in place rather than creating duplicates. Safe to run anytime.
 *
 *   node --env-file=.env.local scripts/seed-lessons.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = join(HERE, '..', 'data', 'lessons.ts')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local)')
  process.exit(1)
}

// data/lessons.ts is TypeScript; extract the array literal and evaluate it as
// plain JS rather than adding a build step just for seeding.
const raw = readFileSync(SRC, 'utf8')
const start = raw.indexOf('export const LESSONS')
// Seek past the `=` first: the declaration is `LESSONS: LessonSeed[] = [`, so
// the first `[` after `start` belongs to the TYPE annotation, not the array.
const eq = start === -1 ? -1 : raw.indexOf('=', start)
const open = eq === -1 ? -1 : raw.indexOf('[', eq)
if (start === -1 || open === -1) {
  console.error('✗ Could not locate the LESSONS array in data/lessons.ts')
  process.exit(1)
}
// Walk brackets to find the matching close, ignoring those inside strings.
let depth = 0, end = -1, quote = null
for (let i = open; i < raw.length; i++) {
  const ch = raw[i]
  const prev = raw[i - 1]
  if (quote) {
    if (ch === quote && prev !== '\\') quote = null
    continue
  }
  if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue }
  if (ch === '[') depth++
  else if (ch === ']') { depth--; if (depth === 0) { end = i; break } }
}
if (end === -1) { console.error('✗ Unbalanced LESSONS array'); process.exit(1) }

const LESSONS = eval(raw.slice(open, end + 1)) // trusted, version-controlled source

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const rows = LESSONS.map((l) => ({
  slug: l.slug,
  title: l.title,
  summary: l.summary,
  body: l.body,
  category: l.category,
  week_number: l.week_number,
  read_minutes: l.read_minutes,
  published: true,
  updated_at: new Date().toISOString(),
}))

const { error } = await db.from('lessons').upsert(rows, { onConflict: 'slug' })
if (error) { console.error('✗', error.message); process.exit(1) }

const { count } = await db.from('lessons').select('*', { count: 'exact', head: true })
console.log(`✓ Seeded ${rows.length} lessons — library now has ${count} total.`)
