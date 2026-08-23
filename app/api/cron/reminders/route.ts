import { NextResponse, type NextRequest } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/errors'

/**
 * Daily reminder sweep (Vercel Cron).
 *
 * Decides who needs a nudge and pushes it. Free to run: Web Push has no
 * per-message cost, and Vercel Cron is included.
 *
 * Rules, deliberately conservative — an app that over-notifies gets its
 * notifications switched off, which is worse than not having them:
 *   - checkin_due  : active client, onboarded, no check-in in 7+ days
 *   - coach_reply  : unread coach message older than ~6h she hasn't opened
 * At most ONE notification per client per day, enforced by reminder_sends.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY = 24 * 60 * 60 * 1000

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
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

    const [{ data: clients }, { data: checkins }, { data: unread }, { data: alreadySent }] = await Promise.all([
      db.from('clients').select('id, full_name, subscription_status, onboarding_completed').in('id', clientIds),
      db.from('weekly_checkins').select('client_id, submitted_at').in('client_id', clientIds),
      db.from('messages').select('client_id, created_at').in('client_id', clientIds)
        .eq('from_coach', true).eq('read_by_client', false),
      db.from('reminder_sends').select('client_id, kind').eq('sent_on', today),
    ])

    const sentToday = new Set((alreadySent || []).map((r) => r.client_id))

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

      const last = lastCheckin.get(c.id)
      const daysSince = last ? Math.floor((now - last) / DAY) : null
      if (daysSince === null || daysSince >= 7) {
        jobs.push({
          clientId: c.id, kind: 'checkin_due',
          title: 'Your weekly check-in is ready',
          body: 'Five minutes to log this week — it unlocks your trends.',
          url: '/dashboard/check-in',
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
