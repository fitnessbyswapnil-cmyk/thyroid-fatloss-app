'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import webpush from 'web-push'
import { logError } from '@/lib/errors'
import { programmeWeek } from '@/lib/health/programme'

// Photo reviews are written into checkin_feedback too (submitPhotoReview in
// app/actions/photo-review.ts), threaded to the nearest check-in. They are a
// different note from the weekly review, so the weekly review must never take
// one of them for its own earlier draft and overwrite it — that would delete a
// note the client may not have read yet.
const PHOTO_REVIEW_PREFIX = '📸 Photo review —'

/**
 * Tell her a review has landed.
 *
 * Same channel and the same failure handling as the daily sweep in
 * app/api/cron/reminders/route.ts — VAPID from env, one send per registered
 * device, prune the subscription on 404/410 because those mean the device is
 * gone for good and we would otherwise retry it forever.
 *
 * Everything is inside a try/catch and the caller runs it through `after()`,
 * because a review that saved and then 500'd on a push failure is the worst of
 * both outcomes: the coach retypes a note the client already has, and the queue
 * has already moved on. The review is the deliverable. The buzz is not.
 */
async function notifyClientOfReview(clientId: string) {
  try {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const priv = process.env.VAPID_PRIVATE_KEY
    if (!pub || !priv) return
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:fitnessbyswapnil@gmail.com',
      pub,
      priv
    )

    // Service role: pruning a dead subscription and stamping the send ledger are
    // writes on rows the coach's session has no business writing.
    const db = createAdminClient()
    const { data: devices } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('client_id', clientId)
    if (!devices?.length) return

    let delivered = false
    for (const d of devices) {
      try {
        await webpush.sendNotification(
          { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } },
          JSON.stringify({
            title: 'Your coach reviewed your week',
            body: 'Your weekly review is waiting in ThyroWell.',
            url: '/dashboard',
            tag: 'coach_review',
          })
        )
        delivered = true
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          await db.from('push_subscriptions').delete().eq('endpoint', d.endpoint)
        } else {
          await logError('coach-reviews.notify.send', err, clientId)
        }
      }
    }

    if (delivered) {
      const today = new Date().toISOString().slice(0, 10)
      await db
        .from('push_subscriptions')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('client_id', clientId)
      // Spends today's slot in the reminder ledger the cron reads, so she does
      // not also get the generic check-in nudge hours later. A duplicate here
      // (two reviews in one day) trips the unique key and is ignored on purpose.
      await db
        .from('reminder_sends')
        .insert({ client_id: clientId, kind: 'coach_review', sent_on: today })
    }
  } catch (err) {
    await logError('coach-reviews.notify', err, clientId)
  }
}

export interface PendingReview {
  id: string
  client_id: string
  client_name: string
  week_number: number
  /** Week of HER programme — what both sides should be shown. */
  programme_week: number | null
  submitted_at: string
  status: string
  energy: number
  sleep_quality: number
  weight?: number
  stress: number
  reflection: string
  is_flagged: boolean
  flag_reason?: string
  weeks_ago: number
  energy_delta?: number
  sleep_delta?: number
  weight_delta?: number
}

export async function getPendingReviews() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Get the authenticated client (coach)
    const { data: coach } = await supabase
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!coach || coach.role !== 'coach') {
      throw new Error('Only coaches can access pending reviews')
    }

    // Fetch all unreviewed check-ins with client info
    const { data: unreviewed, error } = await supabase
      .from('weekly_checkins')
      .select(`
        id,
        client_id,
        week_number,
        submitted_at,
        status,
        energy_level,
        sleep_quality,
        weight,
        stress_level,
        reflection_text,
        clients:client_id (
          id,
          full_name,
          start_date
        )
      `)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })

    if (error) throw error

    if (!unreviewed || unreviewed.length === 0) {
      return { reviews: [], error: null }
    }

    // Every earlier check-in for the clients in this queue, in one query.
    //
    // This used to fire a query per pending review to find "week_number - 1",
    // which was wrong twice over: it missed the previous check-in whenever a
    // client skipped a week, and it cost one round trip per row on a queue that
    // grows with the roster.
    const clientIds = [...new Set(unreviewed.map((r: any) => r.client_id))]
    const { data: history } = await supabase
      .from('weekly_checkins')
      .select('client_id, submitted_at, energy_level, sleep_quality, weight, stress_level')
      .in('client_id', clientIds)
      .order('submitted_at', { ascending: false })

    const byClient = new Map<string, any[]>()
    for (const row of history || []) {
      const arr = byClient.get(row.client_id) || []
      arr.push(row)
      byClient.set(row.client_id, arr)
    }

    const enrichedReviews: PendingReview[] = await Promise.all(
      unreviewed.map(async (review: any) => {
        // The genuinely previous check-in, by date — not an assumed week number.
        const prevWeek =
          (byClient.get(review.client_id) || []).find(
            (r) => new Date(r.submitted_at).getTime() < new Date(review.submitted_at).getTime()
          ) || null

        const daysAgo = Math.floor(
          (Date.now() - new Date(review.submitted_at).getTime()) / 86400000
        )
        const weeksAgo = Math.floor(daysAgo / 7)

        const energyDelta = prevWeek ? review.energy_level - prevWeek.energy_level : 0
        const sleepDelta = prevWeek ? review.sleep_quality - prevWeek.sleep_quality : 0
        const weightDelta = prevWeek && review.weight && prevWeek.weight 
          ? review.weight - prevWeek.weight 
          : undefined

        // Determine if flagged based on sharp drops, missed meds, or weight changes
        let is_flagged = false
        let flag_reason = ''

        // Sharp energy drop (3+ points)
        if (energyDelta <= -3) {
          is_flagged = true
          flag_reason = 'Energy drop'
        }
        // Sharp mood/stress spike
        else if (review.stress_level >= 8) {
          is_flagged = true
          flag_reason = 'High stress'
        }
        // Large weight change (>1 kg)
        else if (weightDelta && Math.abs(weightDelta) > 1) {
          is_flagged = true
          flag_reason = `Weight ${weightDelta > 0 ? 'gain' : 'loss'}`
        }

        return {
          id: review.id,
          client_id: review.client_id,
          client_name: review.clients?.full_name || 'Unknown',
          week_number: review.week_number,
          // The number the client sees on her own screen. The stored week is the
          // ISO week of the year, which made the queue label yesterday's
          // check-in "Week 34" for a client whose detail page said week 10.
          programme_week: programmeWeek(review.clients?.start_date, review.submitted_at),
          submitted_at: review.submitted_at,
          status: review.status,
          energy: review.energy_level || 0,
          sleep_quality: review.sleep_quality || 0,
          weight: review.weight,
          stress: review.stress_level || 0,
          reflection: review.reflection_text || '',
          is_flagged,
          flag_reason,
          weeks_ago: weeksAgo,
          energy_delta: energyDelta,
          sleep_delta: sleepDelta,
          weight_delta: weightDelta,
        }
      })
    )

    // Sort: flagged first, then oldest (due), then by time submitted
    const sorted = enrichedReviews.sort((a, b) => {
      if (a.is_flagged !== b.is_flagged) return a.is_flagged ? -1 : 1
      if (a.weeks_ago !== b.weeks_ago) return b.weeks_ago - a.weeks_ago
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    })

    return { reviews: sorted, error: null }
  } catch (error) {
    return { 
      reviews: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch pending reviews' 
    }
  }
}

export async function submitCheckInFeedback(
  checkinId: string,
  feedbackBody: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Verify user is a coach
    const { data: coach } = await supabase
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!coach || coach.role !== 'coach') {
      throw new Error('Only coaches can submit feedback')
    }

    const body = feedbackBody.trim()
    if (!body) throw new Error('Feedback cannot be empty')

    // A check-in gets one weekly review, rewritten rather than repeated. The
    // queue could be re-opened on the same check-in — from a stale tab, a back
    // button, a double submit — and every extra row showed up on the client's
    // dashboard as the coach having said the same thing twice.
    const { data: existing, error: existingError } = await supabase
      .from('checkin_feedback')
      .select('id, body')
      .eq('checkin_id', checkinId)
      .order('created_at', { ascending: true })

    if (existingError) throw existingError

    const priorReview = (existing || []).find(
      (row) => !(row.body || '').startsWith(PHOTO_REVIEW_PREFIX)
    )

    // A rewrite must not inherit the old note's read receipt: the coach would be
    // told she read text that no longer exists. Cleared only when the words
    // actually changed, so re-saving an unedited draft does not wipe a genuine
    // receipt.
    const isRewrite = Boolean(priorReview)
    const bodyChanged = isRewrite && (priorReview!.body || '') !== body

    if (priorReview) {
      // coach_id moves to whoever wrote this text: the client reads the body as
      // her coach's own words, so the row must name the person who wrote them.
      const { error: rewriteError } = await supabase
        .from('checkin_feedback')
        .update({
          body,
          coach_id: user.id,
          updated_at: new Date().toISOString(),
          ...(bodyChanged ? { read_at: null } : {}),
        })
        .eq('id', priorReview.id)

      if (rewriteError) throw rewriteError
    } else {
      const { error: feedbackError } = await supabase
        .from('checkin_feedback')
        .insert({
          checkin_id: checkinId,
          coach_id: user.id,
          body,
        })

      if (feedbackError) throw feedbackError
    }

    // Update check-in status to reviewed
    const { data: reviewed, error: updateError } = await supabase
      .from('weekly_checkins')
      .update({ status: 'reviewed' })
      .eq('id', checkinId)
      .select('client_id')
      .single()

    if (updateError) throw updateError

    // Without this the coach's queue kept serving the check-in he just wrote up,
    // so the obvious next click was the one that duplicated the review.
    revalidatePath('/coach')
    if (reviewed?.client_id) revalidatePath(`/coach/client/${reviewed.client_id}`)

    // Only the first time a check-in gets a review. The coach fixing a typo a
    // minute later must not buzz her a second time — an app that over-notifies
    // gets its notifications switched off, and then the ones that matter are
    // gone too. after() so the coach's save returns at DB speed, not at the
    // speed of a push service; a bare promise would be killed when the
    // serverless invocation freezes.
    // The try/catch is around after() itself, not just the send: the review and
    // the status flip are already committed by this point, so anything thrown
    // here would report a failure for work that succeeded and send the coach
    // back to retype a note she already has.
    if (!isRewrite && reviewed?.client_id) {
      const clientId = reviewed.client_id
      try {
        after(() => notifyClientOfReview(clientId))
      } catch (err) {
        await logError('coach-reviews.notify.schedule', err, clientId)
      }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback',
    }
  }
}

/**
 * The client stamps her own read receipt, once, from her own session.
 *
 * She is only granted the read_at column (migration 024: the blanket UPDATE
 * grant is revoked and a trigger freezes the rest), and RLS scopes her to
 * feedback on her own check-ins — so this is safe to call with whatever ids her
 * dashboard happened to render.
 */
export async function markFeedbackRead(feedbackIds: string[]) {
  try {
    if (!feedbackIds?.length) return { success: true, error: null }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // First open wins. The trigger enforces this too, but filtering here keeps
    // the write to zero rows on every later visit instead of one per note.
    const { error } = await supabase
      .from('checkin_feedback')
      .update({ read_at: new Date().toISOString() })
      .in('id', feedbackIds)
      .is('read_at', null)

    if (error) throw error

    // Deliberately no revalidatePath: this fires from her dashboard as the card
    // scrolls into view, and revalidating the page she is looking at would
    // re-render it underneath her to change nothing she can see.
    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark feedback read',
    }
  }
}

export interface ReviewReadReceipt {
  feedback_id: string
  checkin_id: string
  /** null = written, delivered, never opened. */
  read_at: string | null
}

/**
 * Whether each written review has actually been opened.
 *
 * The coach's queue (app/coach/coach-dashboard-client.tsx) and his client page
 * (app/coach/client/[id]/client-detail-view.tsx) are not touched by this
 * change, so nothing renders this yet — it is exposed here for whichever of the
 * two picks it up. getCheckInDetail also carries read_at on each embedded
 * checkin_feedback row now, which is what the review screen already reads.
 */
export async function getReviewReadReceipts(clientId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: coach } = await supabase
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!coach || coach.role !== 'coach') {
      throw new Error('Only coaches can read delivery state')
    }

    const { data: checkins, error: checkinError } = await supabase
      .from('weekly_checkins')
      .select('id')
      .eq('client_id', clientId)

    if (checkinError) throw checkinError
    if (!checkins?.length) return { receipts: [] as ReviewReadReceipt[], error: null }

    const { data, error } = await supabase
      .from('checkin_feedback')
      .select('id, checkin_id, read_at')
      .in('checkin_id', checkins.map((c) => c.id))

    if (error) throw error

    const receipts: ReviewReadReceipt[] = (data || []).map((f) => ({
      feedback_id: f.id as string,
      checkin_id: f.checkin_id as string,
      read_at: (f.read_at as string | null) ?? null,
    }))

    return { receipts, error: null }
  } catch (error) {
    return {
      receipts: [] as ReviewReadReceipt[],
      error: error instanceof Error ? error.message : 'Failed to fetch read receipts',
    }
  }
}

export async function getCheckInDetail(checkinId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Get check-in with client info
    const { data: checkin, error } = await supabase
      .from('weekly_checkins')
      .select(`
        *,
        clients:client_id (full_name, email),
        checkin_feedback (id, body, created_at, read_at)
      `)
      .eq('id', checkinId)
      .single()

    if (error) throw error

    // Get photos for this week
    const { data: photos } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('client_id', checkin.client_id)
      .eq('week_number', checkin.week_number)

    // Get previous week for deltas
    const { data: prevWeek } = await supabase
      .from('weekly_checkins')
      .select('*')
      .eq('client_id', checkin.client_id)
      .eq('week_number', checkin.week_number - 1)
      .single()

    return {
      checkin,
      photos: photos || [],
      prevWeek,
      error: null,
    }
  } catch (error) {
    return {
      checkin: null,
      photos: [],
      prevWeek: null,
      error: error instanceof Error ? error.message : 'Failed to fetch check-in detail',
    }
  }
}
