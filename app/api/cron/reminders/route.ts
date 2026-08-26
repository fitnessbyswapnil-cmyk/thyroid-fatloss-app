import { NextResponse, type NextRequest } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/errors'
import { programmeWeek } from '@/lib/health/programme'

/**
 * Daily reminder sweep (Vercel Cron).
 *
 * Decides who needs a nudge and pushes it. Free to run: Web Push has no
 * per-message cost, and Vercel Cron is included.
 *
 * Rules, deliberately conservative — an app that over-notifies gets its
 * notifications switched off, which is worse than not having them:
 *   - coach_reply  : unread coach message older than ~6h she hasn't opened
 *   - lab_retest   : week 10-12, and her newest report is 8+ weeks old
 *   - checkin_due  : active client, onboarded, no check-in in 7+ days
 *   - photo_due    : week 4+, and her newest photo set is 28+ days old
 * At most ONE notification per client per day, enforced by reminder_sends.
 *
 * The two periodic ones also carry their own cooldown, because unlike a weekly
 * check-in they are not naturally self-limiting: once she is past 28 days
 * without a photo she is past it every day after, and a nudge that repeats
 * daily is how an app gets its notifications switched off for good.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY = 24 * 60 * 60 * 1000

/**
 * How long a periodic nudge stays quiet after being sent, whether or not she
 * acted on it. Seven days means she sees the photo prompt about four times
 * across a twelve-week programme, and the lab prompt two or three times inside
 * its window — enough to land, not enough to nag.
 */
const PERIODIC_COOLDOWN_DAYS = 7

/** Photos: monthly from week 4. Week 1 photos come from the Week 0 checklist. */
const PHOTO_INTERVAL_DAYS = 28
const PHOTO_FROM_WEEK = 4
/**
 * From week 12 the interval shortens, because the closing set is the one that
 * completes the before-and-after — and on a strict 28-day cycle it falls two
 * days after the twelve-week review it exists for.
 */
const PHOTO_FINAL_WEEK = 12
const PHOTO_FINAL_INTERVAL_DAYS = 14

/**
 * Lifetime ceilings. Cooldowns alone do not stop a nudge that has become
 * permanently true: a client who decides not to take photos is past 28 days
 * every day after, so she was being asked eight times in a quarter. After this
 * many she has not missed the message, she has declined it — and the coach's
 * own roster shows him she has no photos.
 */
const MAX_SENDS = { photo_due: 4, lab_retest: 3 } as const

/**
 * The re-test window. The programme is sold on comparing a second blood panel
 * with the first, and a panel booked in week 12 arrives after the review it was
 * meant to inform — so the ask goes out at two and a half months.
 */
const LAB_WINDOW_WEEKS = { from: 10, to: 12 }
const LAB_MIN_AGE_DAYS = 56

function configureWebPush(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:fitnessbyswapnil@gmail.com'
  if (!pub || !priv) return false
  webpush.setVapidDetails(subject, pub, priv)
  return true
}

export async function GET(request: NextRequest) {
  // Vercel Cron sends a bearer token when CRON_SECRET is set. Reject anything
  // else so this can't be triggered by a stranger hitting the URL.
  // Fail closed. This used to skip the check entirely when CRON_SECRET was
  // unset, so a missing env var silently turned a public endpoint into one that
  // reads the whole client roster.
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron.reminders] CRON_SECRET is not set — refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!configureWebPush()) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  const db = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const now = Date.now()

  try {
    // Who can we even reach?
    const { data: subs } = await db.from('push_subscriptions').select('*')
    if (!subs?.length) return NextResponse.json({ ok: true, sent: 0, reason: 'no subscribers' })

    const subsByClient = new Map<string, typeof subs>()
    for (const s of subs) {
      const arr = subsByClient.get(s.client_id) || []
      arr.push(s)
      subsByClient.set(s.client_id, arr)
    }
    const clientIds = [...subsByClient.keys()]

    const [
      { data: clients }, { data: checkins }, { data: unread },
      { data: recentSends }, { data: photos }, { data: labs },
    ] = await Promise.all([
      db.from('clients').select('id, full_name, subscription_status, onboarding_completed, role, start_date').in('id', clientIds),
      db.from('weekly_checkins').select('client_id, submitted_at').in('client_id', clientIds),
      db.from('messages').select('client_id, created_at').in('client_id', clientIds)
        .eq('from_coach', true).eq('read_by_client', false),
      // Every send in the cooldown window, not just today's — the periodic
      // nudges need to know when they last fired, not merely that something did.
      // A full programme's worth, not just the cooldown window — the caps
      // below count lifetime sends, not recent ones.
      db.from('reminder_sends').select('client_id, kind, sent_on')
        .gte('sent_on', new Date(now - 180 * DAY).toISOString().slice(0, 10)),
      db.from('progress_photos').select('client_id, created_at').in('client_id', clientIds),
      db.from('lab_results').select('client_id, taken_on').in('client_id', clientIds),
    ])

    const sentToday = new Set(
      (recentSends || []).filter((r) => r.sent_on === today).map((r) => r.client_id)
    )
    // Latest send per (client, kind), for the periodic cooldowns.
    const lastSendOfKind = new Map<string, string>()
    for (const r of recentSends || []) {
      const key = `${r.client_id}:${r.kind}`
      if (!lastSendOfKind.has(key) || r.sent_on > lastSendOfKind.get(key)!) {
        lastSendOfKind.set(key, r.sent_on)
      }
    }
    const sendCount = new Map<string, number>()
    for (const r of recentSends || []) {
      const key = `${r.client_id}:${r.kind}`
      sendCount.set(key, (sendCount.get(key) ?? 0) + 1)
    }

    const inCooldown = (clientId: string, kind: string) => {
      const on = lastSendOfKind.get(`${clientId}:${kind}`)
      return !!on && (now - new Date(on).getTime()) / DAY < PERIODIC_COOLDOWN_DAYS
    }
    const overCap = (clientId: string, kind: keyof typeof MAX_SENDS) =>
      (sendCount.get(`${clientId}:${kind}`) ?? 0) >= MAX_SENDS[kind]

    /** Newest of a set of dated rows, per client. */
    const newestBy = (rows: { client_id: string }[] | null, field: string) => {
      const m = new Map<string, number>()
      for (const r of rows || []) {
        const raw = (r as Record<string, unknown>)[field]
        if (!raw) continue
        const t = new Date(raw as string).getTime()
        if (!Number.isFinite(t)) continue
        if (t > (m.get(r.client_id) ?? 0)) m.set(r.client_id, t)
      }
      return m
    }
    const lastPhoto = newestBy(photos, 'created_at')
    const lastLab = newestBy(labs, 'taken_on')

    const lastCheckin = new Map<string, number>()
    for (const c of checkins || []) {
      if (!c.submitted_at) continue
      const t = new Date(c.submitted_at).getTime()
      if (t > (lastCheckin.get(c.client_id) ?? 0)) lastCheckin.set(c.client_id, t)
    }

    const oldestUnread = new Map<string, number>()
    for (const m of unread || []) {
      const t = new Date(m.created_at).getTime()
      if (t < (oldestUnread.get(m.client_id) ?? Infinity)) oldestUnread.set(m.client_id, t)
    }

    type Job = { clientId: string; kind: string; title: string; body: string; url: string }
    const jobs: Job[] = []

    for (const c of clients || []) {
      // The coach holds a row in this table too. Without this he gets nudged
      // every day to submit a client check-in that does not exist for him.
      if (c.role && c.role !== 'client') continue
      if (c.subscription_status !== 'active' || !c.onboarding_completed) continue
      if (sentToday.has(c.id)) continue // one nudge per client per day

      // Coach replies are more time-sensitive than a check-in nudge.
      const unreadSince = oldestUnread.get(c.id)
      if (unreadSince && now - unreadSince > 6 * 60 * 60 * 1000) {
        jobs.push({
          clientId: c.id, kind: 'coach_reply',
          title: 'Your coach replied',
          body: 'You have a message waiting in ThyroWell.',
          url: '/dashboard/messages',
        })
        continue
      }

      const week = programmeWeek(c.start_date)
      const daysSincePhoto = lastPhoto.has(c.id)
        ? Math.floor((now - lastPhoto.get(c.id)!) / DAY)
        : null
      const daysSinceLab = lastLab.has(c.id)
        ? Math.floor((now - lastLab.get(c.id)!) / DAY)
        : null

      // The re-test, ahead of the weekly nudge on purpose. A missed check-in is
      // recoverable next week; the second blood panel has a window, and if it
      // is booked after the twelve-week review it cannot inform it.
      if (
        week !== null &&
        week >= LAB_WINDOW_WEEKS.from && week <= LAB_WINDOW_WEEKS.to &&
        (daysSinceLab === null || daysSinceLab >= LAB_MIN_AGE_DAYS) &&
        !inCooldown(c.id, 'lab_retest') && !overCap(c.id, 'lab_retest')
      ) {
        jobs.push({
          clientId: c.id, kind: 'lab_retest',
          title: 'Time for your second blood panel',
          body: 'Book the same tests as last time — the comparison is the point.',
          url: '/dashboard/health',
        })
        continue
      }

      const last = lastCheckin.get(c.id)
      const daysSince = last ? Math.floor((now - last) / DAY) : null
      // Stop after three weeks. Past that she has not lapsed, she has stopped,
      // and a daily nudge is how an app gets its notifications turned off for
      // good. Silence here, and the coach's quiet-client list picks her up.
      if (daysSince !== null && daysSince > 21) continue
      if (daysSince === null || daysSince >= 7) {
        jobs.push({
          clientId: c.id, kind: 'checkin_due',
          title: 'Your weekly check-in is ready',
          body: 'Five minutes to log this week — it unlocks your trends.',
          url: '/dashboard/check-in',
        })
        continue
      }

      // Monthly photos. Not before week 4 — her week-1 set comes from the Week 0
      // checklist, and asking again a fortnight later shows her nothing.
      const photoInterval =
        week !== null && week >= PHOTO_FINAL_WEEK ? PHOTO_FINAL_INTERVAL_DAYS : PHOTO_INTERVAL_DAYS
      if (
        week !== null && week >= PHOTO_FROM_WEEK &&
        (daysSincePhoto === null || daysSincePhoto >= photoInterval) &&
        !inCooldown(c.id, 'photo_due') && !overCap(c.id, 'photo_due')
      ) {
        jobs.push({
          clientId: c.id, kind: 'photo_due',
          title: 'Your monthly photos are due',
          body: 'Same pose, same light. These usually show what the scale does not.',
          url: '/dashboard/progress-photos',
        })
      }
    }

    let sent = 0
    let pruned = 0

    for (const job of jobs) {
      const devices = subsByClient.get(job.clientId) || []
      let deliveredToAnyDevice = false

      for (const d of devices) {
        try {
          await webpush.sendNotification(
            { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } },
            JSON.stringify({ title: job.title, body: job.body, url: job.url, tag: job.kind })
          )
          deliveredToAnyDevice = true
        } catch (err: unknown) {
          // 404/410 mean the subscription is dead (app uninstalled, permission
          // revoked). Prune it so we stop retrying forever.
          const status = (err as { statusCode?: number })?.statusCode
          if (status === 404 || status === 410) {
            await db.from('push_subscriptions').delete().eq('endpoint', d.endpoint)
            pruned++
          } else {
            await logError('cron.reminders.send', err, job.clientId)
          }
        }
      }

      if (deliveredToAnyDevice) {
        sent++
        await db.from('reminder_sends').insert({ client_id: job.clientId, kind: job.kind, sent_on: today })
        await db.from('push_subscriptions')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('client_id', job.clientId)
      }
    }

    return NextResponse.json({ ok: true, candidates: jobs.length, sent, pruned })
  } catch (err) {
    await logError('cron.reminders', err)
    return NextResponse.json({ error: 'Reminder sweep failed' }, { status: 500 })
  }
}
