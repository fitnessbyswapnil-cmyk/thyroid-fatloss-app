'use server'

import { createClient } from '@/lib/supabase/server'
import { guard, failed } from '@/lib/errors'

export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/**
 * Store (or refresh) a device's push subscription. Push services rotate
 * endpoints, so this upserts on `endpoint` — re-subscribing on the same device
 * updates the row instead of accumulating stale ones.
 */
export async function savePushSubscription(sub: PushSubscriptionInput) {
  return guard('push.savePushSubscription', failed('Could not enable reminders.'), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return { success: false, error: 'Invalid subscription' }
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        client_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth },
      { onConflict: 'endpoint' }
    )
    if (error) return { success: false, error: error.message }
    return { success: true }
  })
}

/** Called when a client turns reminders off, or the browser revokes access. */
export async function removePushSubscription(endpoint: string) {
  return guard('push.removePushSubscription', failed('Could not turn reminders off.'), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('client_id', user.id)
      .eq('endpoint', endpoint)
    if (error) return { success: false, error: error.message }
    return { success: true }
  })
}
