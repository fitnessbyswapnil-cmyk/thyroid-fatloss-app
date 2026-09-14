import 'server-only'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/errors'

export interface PushPayload {
  title: string
  body: string
  url: string
  tag: string
}

/**
 * Send one notification to every registered device of the given users.
 *
 * VAPID from env; a 404/410 means the device is gone for good, so its
 * subscription is pruned instead of being retried forever. Never throws:
 * callers run this through `after()`, and the thing that triggered it (a
 * review, an upload) has already succeeded — a failed buzz must not undo that.
 *
 * Returns the ids of users reached on at least one device.
 */
export async function pushToUsers(userIds: string[], payload: PushPayload): Promise<string[]> {
  const reached = new Set<string>()
  try {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const priv = process.env.VAPID_PRIVATE_KEY
    if (!pub || !priv || userIds.length === 0) return []
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:fitnessbyswapnil@gmail.com', pub, priv)

    const db = createAdminClient()
    const { data: devices } = await db
      .from('push_subscriptions')
      .select('client_id, endpoint, p256dh, auth')
      .in('client_id', userIds)

    for (const d of devices || []) {
      try {
        await webpush.sendNotification(
          { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } },
          JSON.stringify(payload)
        )
        reached.add(d.client_id)
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          await db.from('push_subscriptions').delete().eq('endpoint', d.endpoint)
        } else {
          await logError(`push.${payload.tag}`, err, d.client_id)
        }
      }
    }
    if (reached.size) {
      await db.from('push_subscriptions').update({ last_sent_at: new Date().toISOString() }).in('client_id', [...reached])
    }
  } catch (err) {
    await logError(`push.${payload.tag}`, err)
  }
  return [...reached]
}
