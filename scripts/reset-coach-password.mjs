/**
 * Reset the coach account's password directly (no email needed).
 * Run from the repo root:
 *   NEW_PASS='YourNewPassword123' node --env-file=.env.local scripts/reset-coach-password.mjs
 * Use SINGLE quotes around the password so the shell doesn't choke on ! or $.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const NEW = process.env.NEW_PASS
const COACH_EMAIL = process.env.COACH_EMAIL || 'fitnessbyswapnil@gmail.com'

if (!url || !key) { console.error('Missing Supabase env — run with --env-file=.env.local'); process.exit(1) }
if (!NEW || NEW.length < 8) { console.error('Set NEW_PASS to at least 8 characters.'); process.exit(1) }

const admin = createClient(url, key, { auth: { persistSession: false } })

const { data, error: listErr } = await admin.auth.admin.listUsers()
if (listErr) { console.error('Could not reach Supabase:', listErr.message); process.exit(1) }

const u = data.users.find((x) => x.email?.toLowerCase() === COACH_EMAIL.toLowerCase())
if (!u) { console.error('No account found for', COACH_EMAIL); process.exit(1) }

const { error } = await admin.auth.admin.updateUserById(u.id, { password: NEW, email_confirm: true })
console.log(error ? 'FAILED: ' + error.message : `Password updated for ${u.email} — log in with your new password.`)
