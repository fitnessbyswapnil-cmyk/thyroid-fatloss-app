'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { list, del } from '@vercel/blob'
import { guard } from '@/lib/errors'

/**
 * Export everything we hold about the signed-in client as a plain object.
 * RLS scopes every query to the caller's own rows.
 */
export async function exportMyData() {
  return guard(
    'account.exportMyData',
    { success: false as const, error: 'Could not build your export. Please try again.' },
    async () => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false as const, error: 'Not authenticated' }

      const [profile, checkins, photos, insights, plans, feedback, health, labs, messages] = await Promise.all([
        supabase.from('clients').select('*').eq('id', user.id).single(),
        supabase.from('weekly_checkins').select('*').eq('client_id', user.id),
        supabase.from('progress_photos').select('*').eq('client_id', user.id),
        supabase.from('coach_insights').select('*').eq('client_id', user.id),
        supabase.from('plans').select('*').eq('client_id', user.id),
        supabase.from('checkin_feedback').select('*'), // RLS: only feedback on own check-ins
        supabase.from('health_profiles').select('*').eq('client_id', user.id),
        supabase.from('lab_results').select('*').eq('client_id', user.id),
        supabase.from('messages').select('*').eq('client_id', user.id),
      ])

      return {
        success: true as const,
        data: {
          exported_at: new Date().toISOString(),
          account: { id: user.id, email: user.email },
          profile: profile.data ?? null,
          weekly_checkins: checkins.data ?? [],
          progress_photos: photos.data ?? [],
          coach_insights: insights.data ?? [],
          plans: plans.data ?? [],
          checkin_feedback: feedback.data ?? [],
          // Added with the thyroid layer — an export that omitted these would
          // no longer be a complete copy of the client's health data.
          health_profile: health.data ?? [],
          lab_results: labs.data ?? [],
          messages: messages.data ?? [] } }
    }
  )
}

/**
 * Permanently delete the signed-in client's account and all associated data.
 * Deleting the auth user cascades to clients and every child table (all FKs are
 * ON DELETE CASCADE). Best-effort removal of their private progress-photo blobs.
 */
export async function deleteMyAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const userId = user.id
  const admin = createAdminClient()

  // Best-effort: remove the user's private photo blobs (prefixed with their id).
  try {
    const { blobs } = await list({ prefix: `${userId}/` })
    if (blobs.length) await del(blobs.map((b) => b.url))
  } catch {
    // non-fatal — DB deletion is the source of truth
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { success: false, error: error.message }

  // Invalidate the local session cookie (user no longer exists).
  await supabase.auth.signOut()
  return { success: true }
}
