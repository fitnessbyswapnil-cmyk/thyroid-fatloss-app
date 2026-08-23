'use server'

import { logError } from '@/lib/errors'

/**
 * Lets a client-side error boundary record itself.
 *
 * The error log was only ever written from server actions, so a render crash —
 * the failure a client is most likely to actually meet — never reached the
 * coach's app-health panel.
 */
export async function logClientError(context: string, message: string) {
  try {
    await logError(context, new Error(message))
  } catch {
    // Reporting a failure must never itself throw into an error boundary.
  }
}
