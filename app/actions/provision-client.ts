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

    if (inviteError) {
      // Most common: the user already exists.
      return { success: false, error: inviteError.message }
    }

    // Ensure the clients row is active (trigger created it via the invite).
    const newUserId = invited.user?.id
    if (newUserId) {
      await admin
        .from('clients')
        .update({ full_name: fullName, role: 'client', subscription_status: 'active', onboarding_completed: false })
        .eq('id', newUserId)
    }

    revalidatePath('/coach')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to invite client' }
  }
}
