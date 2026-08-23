"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { toggleMealLog, getMealLogs } from "@/app/actions/logs"

/** Local YYYY-MM-DD so a late dinner logs on the right day. */
function localDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * Tick each meal slot as eaten-as-planned.
 *
 * Deliberately NOT food logging: competing with MyFitnessPal on macro entry is
 * a losing game, and clients abandon it. Ticking the meals her coach actually
 * planned takes two seconds and answers the only question that matters for
 * adherence — did she follow the plan today?
 */
export function MealLogger({ meals }: { meals: string[] }) {
  const date = localDate()
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const logs = await getMealLogs(date)
      if (cancelled) return
      setDone(new Set(logs.filter((l) => l.done).map((l) => l.meal)))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [date])

  const toggle = async (meal: string) => {
    const next = !done.has(meal)
    setBusy(meal)
    // Optimistic — a tick that lags feels broken.
    setDone((p) => {
      const s = new Set(p)
      next ? s.add(meal) : s.delete(meal)
      return s
    })
    const revert = () =>
      setDone((p) => {
        const s = new Set(p)
        next ? s.delete(meal) : s.add(meal)
        return s
      })

    try {
      const res = await toggleMealLog(date, meal, next)
      // A returned failure was already handled. A THROWN one was not: on a
      // dropped connection the tick stayed on and busy never cleared, so she
      // saw a meal marked done that no row exists for — and the coach then
      // reads adherence that is wrong in the direction that costs trust.
      if (!res.success) {
        revert()
        setSaveError("That didn't save. Tap again in a moment.")
      } else {
        setSaveError(null)
      }
    } catch {
      revert()
      setSaveError("You may have lost signal — that didn't save. Tap again when you're back.")
    } finally {
      setBusy(null)
    }
  }

  const errorNote = saveError ? (
    <p className="text-[11.5px] mt-2.5 px-1" style={{ color: "#f59e0b", lineHeight: 1.5 }} role="alert">
      {saveError}
    </p>
  ) : null

  if (!meals.length) return null
  const count = meals.filter((m) => done.has(m)).length

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.16em" }}>
          Today&rsquo;s meals
        </p>
        {!loading && (
          <span className="text-[11px] tabular-nums" style={{ color: count === meals.length ? "#34d399" : "#5a6578" }}>
            {count}/{meals.length}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {meals.map((m) => {
          const isDone = done.has(m)
          return (
            <button
              key={m}
              onClick={() => toggle(m)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3 py-2 transition-colors"
              style={
                isDone
                  ? { background: "rgba(52,211,153,0.14)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#a9b2c1", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {busy === m
                ? <Loader2 size={12} className="animate-spin" />
                : isDone
                ? <Check size={12} strokeWidth={3} />
                : <span className="w-3 h-3 rounded-full" style={{ border: "1.5px solid #5a6578" }} />}
              {m}
            </button>
          )
        })}
      </div>
      {errorNote}
    </div>
  )
}
