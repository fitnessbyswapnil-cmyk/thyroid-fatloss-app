"use client"

import { useEffect, useSyncExternalStore, type ReactNode } from "react"

export type FocusKey = "checkin" | "feedback" | "done" | "meal" | "movement" | "log"

export interface FocusState {
  checkinDue: boolean
  unreadFeedback: boolean
  logComplete: boolean
}

/**
 * Which one thing Today leads with.
 *
 * State beats the clock: an overdue check-in or an unread note from the coach
 * outranks anything the time of day suggests. After that it is the device's own
 * hour — not the server's, which runs in Singapore — so a client in any
 * timezone gets breakfast in the morning and her three taps at night.
 */
export function pickFocus(state: FocusState, hour: number | null): FocusKey {
  if (state.checkinDue) return "checkin"
  if (state.unreadFeedback) return "feedback"
  if (state.logComplete) return "done"
  if (hour === null) return "log"
  if (hour < 11) return "meal"
  if (hour < 18) return "movement"
  return "log"
}

/** The slot "next meal" means at a given hour. */
export function nextMealSlot(hour: number | null): string {
  if (hour === null || hour < 11) return "Breakfast"
  if (hour < 16) return "Lunch"
  return "Dinner"
}

// Re-read the hour once a minute so an app left open across 11:00 moves on.
const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 60_000)
  return () => clearInterval(t)
}
const getHour = () => new Date().getHours()

/** `serverHour` is what the server rendered with, so hydration matches it. */
export function useLocalHour(serverHour: number | null = null): number | null {
  return useSyncExternalStore(subscribe, getHour, () => serverHour)
}

/** Tell the server this phone's timezone, for next time (see lib/client-hour.ts). */
function useTimezoneCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) document.cookie = `tw_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`
    } catch {}
  }, [])
}

/**
 * Renders the primary block, then everything else under "Also today".
 *
 * Every candidate arrives already rendered — this is a client component fed by
 * a server page, so it can take nodes but not render functions. The chosen one
 * is lifted to the top and left out of the list, so nothing renders twice. The
 * meal block comes in variants per slot: when the primary is "eat next", the
 * list below shows only the other meals.
 */
export function TodayFocus({
  state,
  primary,
  secondaryOrder,
  secondary,
  meals,
  alsoLabel = "Also today",
  footer,
  serverHour = null,
}: {
  state: FocusState
  primary: Partial<Record<FocusKey, ReactNode>>
  secondaryOrder: FocusKey[]
  secondary: Partial<Record<FocusKey, ReactNode>>
  meals: { all: ReactNode; next: Record<string, ReactNode>; others: Record<string, ReactNode> } | null
  alsoLabel?: string
  footer?: ReactNode
  serverHour?: number | null
}) {
  useTimezoneCookie()
  const hour = useLocalHour(serverHour)
  let focus = pickFocus(state, hour)
  const slot = nextMealSlot(hour)
  // A candidate with nothing to show (no plan yet, say) falls through to the log.
  const available = (k: FocusKey) => (k === "meal" ? Boolean(meals?.next[slot]) : Boolean(primary[k]))
  if (!available(focus)) focus = "log"
  if (!available(focus)) focus = (["checkin", "feedback", "movement"] as FocusKey[]).find(available) ?? focus

  const top = focus === "meal" ? meals?.next[slot] : primary[focus]
  // The meal slot stays in the list when a single meal leads: the list then
  // shows the other meals of the day.
  const rest = secondaryOrder.filter((k) => k !== focus || k === "meal")

  return (
    <div className="space-y-6">
      <div>{top}</div>
      <div className="space-y-5">
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.16em" }}>{alsoLabel}</p>
        {rest.map((k) => {
          const node = k === "meal" ? (focus === "meal" ? meals?.others[slot] : meals?.all) : secondary[k]
          return node ? <div key={k}>{node}</div> : null
        })}
        {footer}
      </div>
    </div>
  )
}
