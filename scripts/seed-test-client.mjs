/**
 * Seed (or delete) ONE test client so you can walk the full gated journey
 * without depending on email/SMTP. Creates a CONFIRMED auth user with a
 * password (so you log in directly at /auth/login) plus an active clients row.
 *
 * Uses the service-role key from .env.local — run it locally, never ship it.
 *
 * USAGE (Node 20.6+; you have v24):
 *   # create — use an email you own and a password you'll remember:
 *   TEST_EMAIL="you@yours.com" TEST_PASSWORD="TestPass123!" TEST_NAME="Test Client" \
 *     node --env-file=.env.local scripts/seed-test-client.mjs create
 *
 *   # delete it afterwards (removes auth user; clients row + data cascade):
 *   TEST_EMAIL="you@yours.com" node --env-file=.env.local scripts/seed-test-client.mjs delete
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local).')
  process.exit(1)
}

const EMAIL = process.env.TEST_EMAIL
const PASSWORD = process.env.TEST_PASSWORD || 'TestPass123!'
const NAME = process.env.TEST_NAME || 'Test Client'
const cmd = process.argv[2]

if (!EMAIL) {
  console.error('Set TEST_EMAIL to an address you own.')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function findUserByEmail(email) {
  // listUsers is paginated; one page is plenty for a near-empty project.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null
}

async function create() {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true, // confirmed -> can log in immediately, no email needed
    user_metadata: { full_name: NAME, role: 'client' },
  })
  if (error) { console.error('createUser failed:', error.message); process.exit(1) }

  // The handle_new_user trigger creates the clients row; mark it active.
  const { error: upErr } = await admin
    .from('clients')
    .update({ full_name: NAME, role: 'client', subscription_status: 'active', onboarding_completed: false })
    .eq('id', data.user.id)
  if (upErr) { console.error('activate clients row failed:', upErr.message); process.exit(1) }

  console.log('\n✅ Test client created')
  console.log('   email:   ', EMAIL)
  console.log('   password:', PASSWORD)
  console.log('   user id: ', data.user.id)
  console.log('\nLog in at /auth/login, then walk: onboarding → consent → check-in → plans.')
  console.log('Delete when done:')
  console.log(`   TEST_EMAIL="${EMAIL}" node --env-file=.env.local scripts/seed-test-client.mjs delete\n`)
}

async function remove() {
  const user = await findUserByEmail(EMAIL)
  if (!user) { console.log('No user found for', EMAIL, '— nothing to delete.'); return }
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) { console.error('deleteUser failed:', error.message); process.exit(1) }
  console.log(`🗑️  Deleted ${EMAIL} (${user.id}) — clients row and all data cascaded.`)
}

if (cmd === 'create') await create()
else if (cmd === 'delete') await remove()
else { console.error('Usage: ... seed-test-client.mjs <create|delete>'); process.exit(1) }
