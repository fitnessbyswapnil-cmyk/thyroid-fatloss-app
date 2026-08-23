/**
 * What each client has been given, and what she is still waiting for.
 *
 * The roster answered "how is she doing" and never "what do I still owe her",
 * so the only way to find a client with no workout plan in week three was to
 * open every client and look. That is precisely the miss that costs a renewal,
 * and it gets likelier as the roster grows.
 *
 * Two rules shape this:
 *
 * Onboarding gates the plans. Height, weight, preferences and medication all
 * arrive with it, and a meal plan written without them is a guess. So when she
 * has not onboarded, the plans are reported as `blocked` rather than
 * outstanding — a coach should not be shown two items they cannot act on and
 * left to work out why.
 *
 * "Waiting on her" and "waiting on you" are kept apart for the same reason
 * lib/coach/engagement.ts splits never-started from gone-quiet: one needs a
 * nudge, the other needs your evening. Collapsing them into a single count
 * hides which.
 */

export type SetupState = "done" | "todo" | "blocked"

export interface SetupItem {
  key: "onboarding" | "meal" | "workout"
  label: string
  state: SetupState
  /** Whose move it is. Drives the two separate counts. */
  owner: "coach" | "client"
  /** When it was assigned, for the ones that are done. */
  at?: string | null
}

export interface ClientSetup {
  items: SetupItem[]
  /** Outstanding items that are the coach's to do, and actionable now. */
  coachTodo: number
  /** Everything is assigned and nothing is blocked. */
  complete: boolean
  /** Nothing the coach can do until she moves first. */
  waitingOnClient: boolean
  /** One line for the roster chip. Null when there is nothing to say. */
  summary: string | null
}

export interface AssignedPlan {
  client_id: string
  type: string
  assigned_at?: string | null
  created_at?: string | null
}

/**
 * @param plans every plan row for the roster — grouped here rather than queried
 *   per client, because the roster renders all of them at once.
 */
export function buildSetupIndex(
  clients: { id: string; onboarding_completed?: boolean | null }[],
  plans: AssignedPlan[]
): Record<string, ClientSetup> {
  const byClient = new Map<string, AssignedPlan[]>()
  for (const p of plans) {
    const list = byClient.get(p.client_id)
    if (list) list.push(p)
    else byClient.set(p.client_id, [p])
  }

  const index: Record<string, ClientSetup> = {}
  for (const c of clients) {
    index[c.id] = clientSetup(!!c.onboarding_completed, byClient.get(c.id) ?? [])
  }
  return index
}

export function clientSetup(onboarded: boolean, plans: AssignedPlan[]): ClientSetup {
  // Newest wins. A coach who revises a plan leaves the old row in place, and
  // the date the roster shows should be the one she is actually following.
  const newestOf = (type: string) => {
    const matching = plans.filter((p) => p.type === type)
    if (matching.length === 0) return null
    return matching
      .map((p) => p.assigned_at || p.created_at || null)
      .sort((a, b) => (b || "").localeCompare(a || ""))[0] ?? null
  }

  const mealAt = newestOf("meal")
  const workoutAt = newestOf("workout")
  const hasMeal = plans.some((p) => p.type === "meal")
  const hasWorkout = plans.some((p) => p.type === "workout")

  // A plan that already exists stays "done" even before onboarding — the
  // gate is about whether you can sensibly write one, not about erasing one
  // you already wrote.
  const planState = (has: boolean): SetupState => (has ? "done" : onboarded ? "todo" : "blocked")

  const items: SetupItem[] = [
    { key: "onboarding", label: "Onboarding", state: onboarded ? "done" : "todo", owner: "client" },
    { key: "meal", label: "Meal plan", state: planState(hasMeal), owner: "coach", at: mealAt },
    { key: "workout", label: "Workout plan", state: planState(hasWorkout), owner: "coach", at: workoutAt },
  ]

  const coachTodo = items.filter((i) => i.owner === "coach" && i.state === "todo").length
  const blocked = items.filter((i) => i.state === "blocked").length
  const complete = items.every((i) => i.state === "done")

  let summary: string | null = null
  if (complete) summary = null
  else if (blocked > 0) summary = "Waiting on her profile"
  else if (coachTodo === 2) summary = "No plans assigned"
  else if (!hasMeal) summary = "Meal plan to assign"
  else if (!hasWorkout) summary = "Workout plan to assign"
  // Both plans written, but she never finished her profile. Rare, and easy to
  // fall through the branches above into silence — which would leave the only
  // outstanding item invisible on the roster.
  else if (!onboarded) summary = "Profile unfinished"

  return { items, coachTodo, complete, waitingOnClient: blocked > 0, summary }
}
