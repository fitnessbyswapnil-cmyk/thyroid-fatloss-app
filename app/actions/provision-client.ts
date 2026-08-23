'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/env'
import { revalidatePath } from 'next/cache'

interface InviteClientInput {
  email: string
  fullName: string
}

/**
 * Coach-only: provision a new client after external payment. Sends a Supabase
 * magic-link invite (creates the auth user; the handle_new_user trigger creates
 * the clients row), then marks them role='client', subscription_status='active'.
 * Payment itself stays in the external funnel — this only grants access.
 */
export async function inviteClient(input: InviteClientInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Authorize: caller must be a coach/admin.
    const { data: caller } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (!caller || (caller.role !== 'coach' && caller.role !== 'admin')) {
      return { success: false, error: 'Only coaches can add clients' }
    }

    const email = input.email.trim().toLowerCase()
    const fullName = input.fullName.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Enter a valid email address' }
    }

    const admin = createAdminClient()
    // Built from NEXT_PUBLIC_SITE_URL (throws in prod if unset). After the
    // invitee exchanges the code, the callback sends them to onboarding.
    const redirectTo = `${getSiteUrl()}/auth/callback?next=/onboarding`

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: 'client' },
      redirectTo,
    })

    // A failed send must NEVER look like success. Log the real cause and return
    // a clear, actionable error to the coach. Do not activate the client here.
    if (inviteError || !invited?.user) {
      console.error('[inviteClient] invite send failed for', email, '—', inviteError)
      const msg = inviteError?.message || ''
      const alreadyExists = /already|registered|exists/i.test(msg)
      return {
        success: false,
        error: alreadyExists
          ? 'A client with this email already exists.'
          : 'Invite could not be sent — check Supabase email settings.',
      }
    }

    // Invite sent. Ensure the clients row (created by the handle_new_user
    // trigger) is named and active. The column already defaults to 'active',
    // so a hiccup here doesn't block access — but we log it rather than swallow.
    const { error: updateError } = await admin
      .from('clients')
      .update({ full_name: fullName, role: 'client', subscription_status: 'active', onboarding_completed: false })
      .eq('id', invited.user.id)
    if (updateError) {
      console.error('[inviteClient] client invited but row activation update failed:', updateError)
    }

    revalidatePath('/coach')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to invite client' }
  }
}

/**
 * The unambiguous half of the alphabet. A temporary password gets read off one
 * screen and typed into a phone, usually via WhatsApp, so l/1/I and O/0 are
 * left out entirely — they are the characters that generate the "it says wrong
 * password" call.
 */
const SAFE = "abcdefghjkmnpqrstuvwxyz"
const WORDS = [
  "amber", "basil", "cedar", "coral", "delta", "ember", "fern", "grove",
  "harbor", "indigo", "jasmine", "kite", "lotus", "maple", "nectar", "olive",
  "pearl", "quartz", "river", "sage", "tulip", "umber", "violet", "willow",
  "cactus", "dune", "flint", "garnet", "heron", "ivory", "juniper", "kelp",
]

function generatePassword(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(3))
  const a = WORDS[bytes[0] % WORDS.length]
  const b = WORDS[bytes[1] % WORDS.length]
  const n = 1000 + (bytes[2] % 9000)
  return `${a}-${b}-${n}`
}

/**
 * Coach-only: create a client's login directly, with a password, and hand the
 * credentials back to the coach once.
 *
 * This exists because `inviteClient` above depends on Supabase sending an
 * email, and when that is misconfigured — as it is on a fresh project, where
 * the built-in sender is rate-limited to a trickle and silently 500s — a coach
 * who has just been paid cannot let their client in at all. Here the coach
 * creates the account and passes the credentials over WhatsApp, which is where
 * this business already talks to its clients.
 *
 * `email_confirm: true` is deliberate and safe in this shape: the coach is
 * vouching for an address they were paid through, and without it Supabase holds
 * the account back pending a confirmation email that is exactly the thing that
 * does not work.
 *
 * The password is temporary by construction. `must_set_password` is stamped on
 * the auth user, and the dashboard gate sends her to choose her own before she
 * sees anything — so the value the coach can read is only ever good for one
 * sign-in.
 */
export async function createClientLogin(input: { email: string; fullName: string; password?: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: caller } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (!caller || (caller.role !== 'coach' && caller.role !== 'admin')) {
      return { success: false, error: 'Only coaches can add clients' }
    }

    const email = input.email.trim().toLowerCase()
    const fullName = input.fullName.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Enter a valid email address' }
    }
    if (!fullName) return { success: false, error: "Enter the client's name" }

    const password = input.password?.trim() || generatePassword()
    if (password.length < 8) return { success: false, error: 'Password must be at least 8 characters' }

    const admin = createAdminClient()
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'client', must_set_password: true },
    })

    if (createError || !created?.user) {
      console.error('[createClientLogin] create failed for', email, '—', createError)
      const msg = createError?.message || ''
      return {
        success: false,
        error: /already|registered|exists/i.test(msg)
          ? 'A client with this email already exists.'
          : 'Could not create the login. Please try again.',
      }
    }

    // The handle_new_user trigger has already inserted the row with role
    // 'client'. This names it and turns access on.
    const { error: updateError } = await admin
      .from('clients')
      .update({
        full_name: fullName,
        role: 'client',
        subscription_status: 'active',
        onboarding_completed: false,
      })
      .eq('id', created.user.id)
    if (updateError) {
      console.error('[createClientLogin] row activation failed:', updateError)
      return { success: false, error: 'Login created, but activating the account failed. Check the client list.' }
    }

    revalidatePath('/coach')
    // Returned once, to be copied and sent. Never stored anywhere we can read
    // it back — Supabase only keeps the hash.
    return { success: true, email, password }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create login' }
  }
}
