import "server-only"
import { cookies } from "next/headers"

export const TZ_COOKIE = "tw_tz"

/**
 * The client's local hour, as best the server can know it.
 *
 * Today's lead block depends on her clock, and the server runs in Singapore.
 * The browser writes its IANA timezone into a cookie (TimezoneCookie), so from
 * her second visit on the server renders the right block and hydration has
 * nothing to swap. Null on a first visit or an unknown zone — the client then
 * corrects it on hydration.
 */
export async function getClientHour(): Promise<number | null> {
  const tz = (await cookies()).get(TZ_COOKIE)?.value
  if (!tz) return null
  try {
    const h = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: decodeURIComponent(tz) }).format(new Date())
    const n = Number(h)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/**
 * Today's date (YYYY-MM-DD) on her clock, not the server's.
 *
 * The server runs in UTC, so between midnight and 05:30 IST its date is still
 * yesterday — and a log read by the server date would show last night's ticks
 * as this morning's. Uses the same timezone cookie; falls back to server time.
 */
export async function getClientToday(): Promise<string> {
  const tz = (await cookies()).get(TZ_COOKIE)?.value
  if (tz) {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: decodeURIComponent(tz) }).format(new Date())
    } catch {}
  }
  return new Date().toLocaleDateString("en-CA")
}
