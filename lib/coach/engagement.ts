/**
 * Is this client actually using the app?
 *
 * The alert rules in lib/coach/alerts.ts all read check-in data, so they only
 * see a client who is still showing up. This answers the earlier question — is
 * she opening it at all — which is the first thing to go quiet before someone
 * drops off, and the last thing you find out about by waiting for a check-in.
 *
 * The important distinction here is `never` versus `stale`. A client who never
 * started needs setting up; a client who stopped needs a conversation. Collapsing
 * those into one "inactive" state loses the only part that tells you what to do.
 *
 * Pure and dependency-free so it can be tested against fixtures.
 */

export type SignalState = 'active' | 'stale' | 'never'

export interface EngagementSignal {
  key: string
  label: string
  /** Human-readable current value, e.g. "4 of last 7 days". */
  detail: string
  state: SignalState
  /** What the coach should do about it. Omitted when nothing needs doing. */
  hint?: string
}

export interface EngagementInput {
  /** Rows carrying a date we care about. Only the date field is read. */
  mealLogDates: string[]
  exerciseLogDates: string[]
  lessonReadDates: string[]
  labResultDates: string[]
  photoDates: string[]
  checkinDates: string[]
  hasHealthProfile: boolean
  pushSubscriptions: number
  lessonsAvailable: number
  lessonsRead: number
  /** Injected so tests are deterministic; defaults to now. */
  now?: number
}

const DAY = 86_400_000

/** Distinct calendar days present in the last `window` days. */
function activeDays(dates: string[], now: number, window: number): number {
  const cutoff = now - window * DAY
  const days = new Set<string>()
  for (const d of dates) {
    const t = new Date(d).getTime()
    if (!Number.isFinite(t) || t < cutoff || t > now + DAY) continue
    days.add(new Date(t).toISOString().slice(0, 10))
  }
  return days.size
}

function daysSinceLatest(dates: string[], now: number): number | null {
  let newest = -Infinity
  for (const d of dates) {
    const t = new Date(d).getTime()
    if (Number.isFinite(t) && t > newest) newest = t
  }
  if (newest === -Infinity) return null
  return Math.max(0, Math.floor((now - newest) / DAY))
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function buildEngagement(input: EngagementInput): {
  signals: EngagementSignal[]
  active: number
  total: number
  /** True when the client has never touched anything beyond being created. */
  neverStarted: boolean
} {
  const now = input.now ?? Date.now()
  const signals: EngagementSignal[] = []

  // --- Meals: the highest-frequency signal, so it goes stale fastest. ---
  const mealDays = activeDays(input.mealLogDates, now, 7)
  const mealLast = daysSinceLatest(input.mealLogDates, now)
  signals.push({
    key: 'meals',
    label: 'Meal logging',
    detail: mealLast === null ? 'Never logged a meal' : `${mealDays} of the last 7 days`,
    state: mealLast === null ? 'never' : mealDays >= 3 ? 'active' : 'stale',
    hint:
      mealLast === null
        ? 'She may not know the plan is tickable — worth showing her once.'
        : mealDays >= 3
          ? undefined
          : `Last logged ${mealLast === 0 ? 'today' : plural(mealLast, 'day') + ' ago'}. Adherence usually slips here first.`,
  })

  // --- Training ---
  const exDays = activeDays(input.exerciseLogDates, now, 7)
  const exLast = daysSinceLatest(input.exerciseLogDates, now)
  signals.push({
    key: 'training',
    label: 'Workout logging',
    detail: exLast === null ? 'Never logged a session' : `${plural(exDays, 'session')} this week`,
    state: exLast === null ? 'never' : exDays >= 2 ? 'active' : 'stale',
    hint:
      exLast === null
        ? 'Sets and weights are logged from inside the workout plan.'
        : exDays >= 2
          ? undefined
          : `Last session ${exLast === 0 ? 'today' : plural(exLast, 'day') + ' ago'}.`,
  })

  // --- Check-ins: the spine of the programme. ---
  const ciLast = daysSinceLatest(input.checkinDates, now)
  signals.push({
    key: 'checkin',
    label: 'Weekly check-in',
    detail:
      ciLast === null
        ? 'No check-in yet'
        : ciLast === 0
          ? 'Submitted today'
          : `${plural(ciLast, 'day')} ago`,
    state: ciLast === null ? 'never' : ciLast <= 10 ? 'active' : 'stale',
    hint:
      ciLast === null
        ? 'Nothing to chart until the first one lands.'
        : ciLast <= 10
          ? undefined
          : 'Overdue — a nudge here is usually enough.',
  })

  // --- Health profile: one-time, so it is filled or it is not. ---
  signals.push({
    key: 'profile',
    label: 'Health profile',
    detail: input.hasHealthProfile ? 'Completed' : 'Not filled in',
    state: input.hasHealthProfile ? 'active' : 'never',
    hint: input.hasHealthProfile
      ? undefined
      : 'Optional, but it is where allergies come from — the plan generator reads them.',
  })

  // --- Labs: thyroid panels are roughly quarterly, so the window is wide. ---
  const labLast = daysSinceLatest(input.labResultDates, now)
  signals.push({
    key: 'labs',
    label: 'Lab reports',
    detail:
      labLast === null
        ? 'None uploaded'
        : `${plural(input.labResultDates.length, 'report')}, latest ${labLast} days ago`,
    state: labLast === null ? 'never' : labLast <= 120 ? 'active' : 'stale',
    hint:
      labLast === null
        ? 'No trend line until at least one is in.'
        : labLast <= 120
          ? undefined
          : 'Older than a typical retest interval — worth asking for a fresh panel.',
  })

  // --- Photos ---
  const photoLast = daysSinceLatest(input.photoDates, now)
  signals.push({
    key: 'photos',
    label: 'Progress photos',
    detail:
      photoLast === null
        ? 'None uploaded'
        : `${plural(input.photoDates.length, 'set')}, latest ${photoLast} days ago`,
    state: photoLast === null ? 'never' : photoLast <= 35 ? 'active' : 'stale',
    hint:
      photoLast === null
        ? 'The comparison view needs two sets before it shows anything.'
        : photoLast <= 35
          ? undefined
          : 'A fresh set would make the comparison meaningful again.',
  })

  // --- Lessons ---
  const lessonLast = daysSinceLatest(input.lessonReadDates, now)
  signals.push({
    key: 'lessons',
    label: 'Lessons read',
    detail:
      input.lessonsAvailable === 0
        ? 'No lessons published'
        : `${input.lessonsRead} of ${input.lessonsAvailable}`,
    state: input.lessonsRead === 0 ? 'never' : lessonLast !== null && lessonLast <= 30 ? 'active' : 'stale',
    hint:
      input.lessonsRead === 0
        ? 'Education is the part clients forget exists — mention one directly.'
        : lessonLast !== null && lessonLast > 30
          ? `Nothing opened in ${lessonLast} days, with ${input.lessonsAvailable - input.lessonsRead} still unread.`
          : undefined,
  })

  // --- Notifications ---
  signals.push({
    key: 'push',
    label: 'Notifications',
    detail: input.pushSubscriptions > 0 ? `Enabled on ${plural(input.pushSubscriptions, 'device')}` : 'Not enabled',
    state: input.pushSubscriptions > 0 ? 'active' : 'never',
    hint:
      input.pushSubscriptions > 0
        ? undefined
        : 'Reminders cannot reach her until she allows notifications once.',
  })

  const active = signals.filter((s) => s.state === 'active').length
  return {
    signals,
    active,
    total: signals.length,
    neverStarted: signals.every((s) => s.state === 'never'),
  }
}
