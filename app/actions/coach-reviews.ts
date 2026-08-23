'use server'

import { createClient } from '@/lib/supabase/server'
import { programmeWeek } from '@/lib/health/programme'

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

    // Insert feedback
    const { error: feedbackError } = await supabase
      .from('checkin_feedback')
      .insert({
        checkin_id: checkinId,
        coach_id: user.id,
        body: feedbackBody,
      })

    if (feedbackError) throw feedbackError

    // Update check-in status to reviewed
    const { error: updateError } = await supabase
      .from('weekly_checkins')
      .update({ status: 'reviewed' })
      .eq('id', checkinId)

    if (updateError) throw updateError

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback',
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
        checkin_feedback (id, body, created_at)
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
