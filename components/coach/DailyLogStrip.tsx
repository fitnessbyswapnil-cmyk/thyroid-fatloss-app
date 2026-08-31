import { UtensilsCrossed, Dumbbell, Footprints } from "lucide-react"

export interface DailyLogRow {
  date: string
  workout_done: boolean | null
  walk_done: boolean | null
  meals_followed: number | null
  steps: number | null
}

const DAY_MS = 86_400_000
const dayStr = (d: Date) => d.toLocaleDateString("en-CA")

/**
 * The last N days of what she actually ticked, one column per day.
 *
 * Built around absence rather than presence: a client who logs nothing produces
 * no rows at all, so rendering only what came back from the database would show
 * an empty strip and read as "no data" when it means "she stopped". The window
 * is generated from today backwards and rows are matched into it, so a missed
 * day is a visible gap in a row of ticks.
 */
export function DailyLogStrip({ logs, days = 14 }: { logs: DailyLogRow[]; days?: number }) {
  const byDate = new Map(logs.map((l) => [l.date, l]))
  const today = new Date()
  const window = Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * DAY_MS)
    const key = dayStr(d)
    return { key, d, log: byDate.get(key) || null }
  })

  const logged = window.filter((w) => w.log).length
  const mealsHit = window.filter((w) => (w.log?.meals_followed ?? 0) >= 3).length
  const workouts = window.filter((w) => w.log?.workout_done).length
  // Steps she actually tapped a band for, and the average of those bands.
  const stepDays = window.filter((w) => typeof w.log?.steps === "number")
  const avgSteps = stepDays.length
    ? Math.round(stepDays.reduce((a, w) => a + (w.log!.steps as number), 0) / stepDays.length)
    : null

  const ROWS = [
    { label: "Meals", Icon: UtensilsCrossed, hit: (l: DailyLogRow) => (l.meals_followed ?? 0) >= 3,
      partial: (l: DailyLogRow) => (l.meals_followed ?? 0) > 0, count: mealsHit },
    { label: "Exercises", Icon: Dumbbell, hit: (l: DailyLogRow) => !!l.workout_done, count: workouts },
    // 3,000 is the midpoint of the "2-4k" band — the first tap that means she
    // genuinely moved rather than went to the kitchen and back.
    { label: "Steps", Icon: Footprints, hit: (l: DailyLogRow) => (l.steps ?? 0) >= 5000,
      partial: (l: DailyLogRow) => (l.steps ?? 0) >= 3000, count: stepDays.filter((w) => (w.log!.steps as number) >= 5000).length },
  ] as const

  return (
    <div className="p-5 rounded-[20px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[11px] uppercase font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.12em" }}>
          Daily log · last {days} days
        </p>
        <span className="text-[11px] tabular-nums" style={{ color: logged ? "#7e8a9e" : "#fb7185" }}>
          {logged === 0 ? "never logged" : `${logged}/${days} days logged`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[320px] space-y-1.5">
          {/* Date header — first letter of the weekday, and the date on the 1st */}
          <div className="grid gap-[3px] pl-[74px]" style={{ gridTemplateColumns: `repeat(${days}, minmax(0,1fr))` }}>
            {window.map((w) => (
              <div key={w.key} className="text-center text-[9px] tabular-nums" style={{ color: "#5a6578" }}>
                {w.d.toLocaleDateString("en-GB", { weekday: "narrow" })}
              </div>
            ))}
          </div>

          {ROWS.map((row) => (
            <div key={row.label} className="grid gap-[3px] items-center" style={{ gridTemplateColumns: `74px repeat(${days}, minmax(0,1fr))` }}>
              <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "#9aa4b5" }}>
                <row.Icon size={12} style={{ color: "#7e8a9e" }} />
                {row.label}
              </span>
              {window.map((w) => {
                const l = w.log
                const full = l ? row.hit(l) : false
                // Meals is the only one with a middle state: 1 or 2 of 3 is a
                // real signal (which meal is she dropping?), not a failure.
                const part = !full && l && "partial" in row && row.partial ? row.partial(l) : false
                const bg = full ? "#2dd4bf" : part ? "rgba(45,212,191,0.28)" : l ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"
                const title = !l
                  ? `${w.key} — nothing logged`
                  : row.label === "Meals"
                    ? `${w.key} — Meals: ${l.meals_followed ?? 0} of 3`
                    : row.label === "Steps"
                      ? `${w.key} — Steps: ${l.steps == null ? "not logged" : l.steps.toLocaleString()}`
                      : `${w.key} — ${row.label}: ${full ? "done" : "not done"}`
                return (
                  <div
                    key={w.key}
                    title={title}
                    className="h-5 rounded-[4px]"
                    style={{ background: bg, border: l ? "none" : "1px dashed rgba(255,255,255,0.09)" }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {ROWS.map((r) => (
          <span key={r.label} className="text-[11px] tabular-nums" style={{ color: "#9aa4b5" }}>
            {r.label} <strong style={{ color: "#e8eaf0" }}>{r.count}</strong>
            <span style={{ color: "#5a6578" }}>/{days}</span>
          </span>
        ))}
        {avgSteps !== null && (
          <span className="text-[11px] tabular-nums" style={{ color: "#9aa4b5" }}>
            avg <strong style={{ color: "#e8eaf0" }}>{avgSteps.toLocaleString()}</strong>
            <span style={{ color: "#5a6578" }}> steps</span>
          </span>
        )}
        <span className="text-[10px] ml-auto" style={{ color: "#5a6578" }}>
          Dashed = nothing logged · half-shade = partial
        </span>
      </div>
    </div>
  )
}
