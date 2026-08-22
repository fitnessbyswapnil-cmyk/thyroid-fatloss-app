"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Dumbbell } from "lucide-react"
import { logExerciseSet, getSetsForExercise, getLastPerformance, type ExerciseSet } from "@/app/actions/logs"

interface Row { weight: string; reps: string; saved: boolean }

/** Local YYYY-MM-DD (not UTC) so an evening session logs on the right day. */
function localDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * Per-set logging inside the exercise viewer.
 *
 * The point isn't record-keeping — it's progressive overload. Showing what she
 * lifted last time, right next to today's inputs, is what turns "do 3 sets" into
 * a programme that actually progresses.
 */
export function SetLogger({
  exerciseName,
  exerciseId,
  plannedSets,
  plannedReps }: {
  exerciseName: string
  exerciseId?: string | null
  plannedSets?: number | null
  plannedReps?: string | null
}) {
  const date = localDate()
  const setCount = Math.min(Math.max(plannedSets || 3, 1), 8)
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: setCount }, () => ({ weight: "", reps: "", saved: false }))
  )
  const [last, setLast] = useState<ExerciseSet[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSet, setSavingSet] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [todays, previous] = await Promise.all([
        getSetsForExercise(date, exerciseName),
        getLastPerformance(date, exerciseName),
      ])
      if (cancelled) return
      setLast(previous)
      if (todays.length) {
        setRows((prev) => {
          const next = [...prev]
          for (const s of todays) {
            const i = s.set_number - 1
            if (i >= 0 && i < next.length) {
              next[i] = { weight: s.weight_kg?.toString() ?? "", reps: s.reps?.toString() ?? "", saved: true }
            }
          }
          return next
        })
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [date, exerciseName])

  const save = async (i: number) => {
    const row = rows[i]
    // Nothing to record — don't write an empty set.
    if (!row.weight && !row.reps) return
    setSavingSet(i)
    const res = await logExerciseSet({
      date,
      exerciseName,
      exerciseId: exerciseId ?? null,
      setNumber: i + 1,
      weightKg: row.weight === "" ? null : Number(row.weight),
      reps: row.reps === "" ? null : Number(row.reps) })
    setSavingSet(null)
    if (res.success) setRows((p) => p.map((r, idx) => (idx === i ? { ...r, saved: true } : r)))
  }

  const update = (i: number, patch: Partial<Row>) =>
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch, saved: false } : r)))

  const lastFor = (i: number) => last.find((s) => s.set_number === i + 1)
  const inputStyle = { background: "#F1EDE1", border: "1px solid #cfc7b6", color: "#1c1d20" } as const

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-2.5">
        <Dumbbell size={13} style={{ color: "#155e56" }} />
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>
          Log your sets
        </p>
      </div>

      {last.length > 0 && (
        <p className="text-[11.5px] mb-2.5 px-0.5" style={{ color: "#155e56" }}>
          Last time ·{" "}
          {last.map((s) => `${s.reps ?? "—"}${s.weight_kg ? ` @ ${s.weight_kg}kg` : ""}`).join(", ")}
        </p>
      )}

      {loading ? (
        <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: "#155e56" }} /></div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const prev = lastFor(i)
            return (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: "#FDFBF7", border: `1px solid ${r.saved ? "rgba(21, 94, 86,0.25)" : "#e2dbcd"}` }}>
                <span className="w-11 shrink-0 text-[11px] font-semibold" style={{ color: "#8b867c" }}>Set {i + 1}</span>
                <input
                  value={r.weight}
                  onChange={(e) => update(i, { weight: e.target.value })}
                  onBlur={() => save(i)}
                  inputMode="decimal"
                  placeholder={prev?.weight_kg ? String(prev.weight_kg) : "kg"}
                  className="w-full min-w-0 px-2.5 py-2 rounded-lg text-sm tabular-nums focus:outline-none"
                  style={inputStyle}
                  aria-label={`Set ${i + 1} weight in kg`}
                />
                <span className="text-[11px] shrink-0" style={{ color: "#a09a8e" }}>×</span>
                <input
                  value={r.reps}
                  onChange={(e) => update(i, { reps: e.target.value })}
                  onBlur={() => save(i)}
                  inputMode="numeric"
                  placeholder={prev?.reps ? String(prev.reps) : plannedReps || "reps"}
                  className="w-full min-w-0 px-2.5 py-2 rounded-lg text-sm tabular-nums focus:outline-none"
                  style={inputStyle}
                  aria-label={`Set ${i + 1} reps`}
                />
                <span className="w-5 shrink-0 flex justify-center">
                  {savingSet === i
                    ? <Loader2 size={14} className="animate-spin" style={{ color: "#155e56" }} />
                    : r.saved
                    ? <Check size={14} style={{ color: "#155e56" }} strokeWidth={3} />
                    : null}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[10.5px] mt-2.5" style={{ color: "#a09a8e" }}>
        Saves as you go. Leave a set blank if you skipped it — an honest log is more useful than a full one.
      </p>
    </div>
  )
}
