'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface PhotoReviewInput {
  clientId: string
  comparisonLabel: string // human label e.g. "Week 1 → Week 8 (Front)"
  afterDate: string // ISO date of the "after" photo session
  body: string
}

/**
 * Coach submits feedback tied to a before/after photo comparison.
 * - Inserts into checkin_feedback against the check-in nearest the "after"
 *   date (when one exists), so it threads with that week's review.
 * - Always inserts a coach_insight as the client-facing notification (the
 *   client dashboard surfaces the latest unread insight).
 */
export async function submitPhotoReview(input: PhotoReviewInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: coach } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (!coach || (coach.role !== 'coach' && coach.role !== 'admin')) {
      return { success: false, error: 'Only coaches can submit photo reviews' }
    }

    if (!input.body.trim()) return { success: false, error: 'Feedback cannot be empty' }

    // Find the check-in nearest the "after" date for this client.
    const { data: checkins } = await supabase
      .from('weekly_checkins')
      .select('id, submitted_at')
      .eq('client_id', input.clientId)

    let nearestCheckinId: string | null = null
    if (checkins && checkins.length > 0) {
      const target = new Date(input.afterDate).getTime()
      nearestCheckinId = checkins
        .slice()
        .sort(
          (a, b) =>
            Math.abs(new Date(a.submitted_at).getTime() - target) -
            Math.abs(new Date(b.submitted_at).getTime() - target)
        )[0].id
    }

    const note = `📸 Photo review — ${input.comparisonLabel}: ${input.body.trim()}`

    // Thread with the nearest check-in when one exists.
    if (nearestCheckinId) {
      const { error: fbError } = await supabase.from('checkin_feedback').insert({
        checkin_id: nearestCheckinId,
        coach_id: user.id,
        body: note })
      if (fbError) return { success: false, error: fbError.message }
    }

    // Client-facing notification.
    const { error: insightError } = await supabase.from('coach_insights').insert({
      client_id: input.clientId,
      coach_id: user.id,
      insight: note })
    if (insightError) return { success: false, error: insightError.message }

    revalidatePath(`/coach/client/${input.clientId}`)
    return { success: true, threadedToCheckin: Boolean(nearestCheckinId) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to submit review' }
  }
}
