"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, ChevronLeft, ChevronRight, Footprints, Loader2, Play, Sparkles, X } from "lucide-react"
import type { PlanSection, WorkoutItem } from "@/app/actions/plans"
import { ExerciseDemo } from "@/components/dashboard/ExerciseDemo"
import { ExerciseViewer } from "@/components/dashboard/ExerciseViewer"
import { DAYS, dayLabel, groupByDay, scheduledDays, todayDayOfWeek } from "@/lib/plans/schedule"
import { saveDailyLog } from "@/app/actions/daily-log"

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const
const localDate = () => new Date().toLocaleDateString("en-CA")

export function MoveToday({
  hasPlan,
  walk,
  exercises,
  allItems,
  sections,
  autoStart,
  log,
}: {
  hasPlan: boolean
  walk: WorkoutItem | null
  exercises: WorkoutItem[]
  allItems: WorkoutItem[]
  sections: PlanSection[]
  autoStart: boolean
  log: { workoutDone: boolean; mealsFollowed: number; steps: number | null }
}) {
  const router = useRouter()
  const [viewing, setViewing] = useState<WorkoutItem | null>(null)
  const [running, setRunning] = useState(autoStart && exercises.length > 0)
  const [done, setDone] = useState(log.workoutDone)
  const [weekOpen, setWeekOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const today = todayDayOfWeek()
  const scheduled = scheduledDays(allItems)
  const byDay = groupByDay(allItems)

  return (
    <>
      {viewing && <ExerciseViewer item={viewing} onClose={() => setViewing(null)} />}
      {running && (
        <Walkthrough
          exercises={exercises}
          log={log}
          onClose={() => setRunning(false)}
          onDone={() => {
            setDone(true)
            setRunning(false)
            router.refresh()
          }}
        />
      )}

      <header className="max-w-2xl mx-auto px-5" style={{ paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.16em" }}>
          Move · {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
        </p>
        <h1 className="mt-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontSize: 30, lineHeight: 1.15, color: "#e8eaf0" }}>
          {done ? "Done for today" : exercises.length > 0 ? "Today's movement" : "Walk day"}
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "#a9b2c1", lineHeight: 1.55 }}>
          {!hasPlan
            ? "Your coach is preparing your exercises. Until then, the walk is the plan."
            : done
              ? "Exercises are ticked for today. The walk still counts, any time before bed."
              : exercises.length > 0
                ? "Thirty minutes of walking, plus a short set of exercises. Tap Start and the app takes you through them one at a time."
                : "No exercises scheduled today. Do the walk, and rest."}
        </p>
      </header>

      <main className="max-w-2xl mx-auto px-5 mt-6 space-y-3">
        {/* Walk */}
        <div className="p-4 rounded-2xl flex items-center gap-3" style={card}>
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.12)" }}>
            <Footprints size={18} style={{ color: "#2dd4bf" }} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium" style={{ color: "#e8eaf0" }}>{walk?.name || "Walk 30 minutes"}</p>
            <p className="text-[12px] mt-0.5" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>
              {walk?.notes || "A pace where you can talk but not sing. Split it if you like — 15 after lunch, 15 after dinner."}
            </p>
          </div>
        </div>

        {/* Today's exercises */}
        {exercises.length > 0 && (
          <section className="rounded-2xl" style={card}>
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.1em" }}>
                {exercises.length} exercise{exercises.length === 1 ? "" : "s"} · about 20 minutes
              </p>
              <ul className="space-y-1">
                {exercises.map((it, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setViewing(it)}
                      className="w-full flex items-center gap-3 py-2 text-left"
                      aria-label={`${it.name} — how to do it`}
                    >
                      <ExerciseDemo demo={it.demoUrl} start={it.imageStart} end={it.imageEnd} alt={it.name} size={44} rounded={10} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px]" style={{ color: "#e8eaf0" }}>{it.name}</span>
                        <span className="block text-[12px] mt-0.5 tabular-nums" style={{ color: "#7e8a9e" }}>
                          {it.sets ? `${it.sets} ${it.sets === 1 ? "set" : "sets"} × ` : ""}{it.reps || ""}
                        </span>
                      </span>
                      <ChevronRight size={16} className="shrink-0" style={{ color: "#4b5563" }} />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setRunning(true)}
                className="mt-4 h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2 w-full"
                style={done
                  ? { background: "rgba(255,255,255,0.06)", color: "#e8eaf0" }
                  : { background: "#2dd4bf", color: "#06231f", boxShadow: "0 8px 24px rgba(45,212,191,0.25)" }}
              >
                {done ? <><Check size={16} /> Done today · do it again</> : <><Play size={15} fill="#06231f" /> Start</>}
              </button>
            </div>
          </section>
        )}

        {!hasPlan && (
          <div className="flex flex-col items-center text-center py-8 gap-3 rounded-2xl" style={card}>
            <Sparkles size={26} style={{ color: "#404858" }} />
            <p className="text-sm" style={{ color: "#7e8a9e" }}>Your exercises will appear here.</p>
          </div>
        )}

        {/* Other days */}
        {scheduled.size > 0 && (
          <section className="rounded-2xl" style={card}>
            <button onClick={() => setWeekOpen((v) => !v)} className="w-full flex items-center justify-between p-4" aria-expanded={weekOpen}>
              <span className="text-sm font-medium" style={{ color: "#e8eaf0" }}>The rest of the week</span>
              <ChevronDown size={16} style={{ color: "#5a6578", transform: weekOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {weekOpen && (
              <div className="px-4 pb-4 space-y-3">
                {DAYS.map((d) => {
                  const list = (byDay.get(d.n) || []).filter((w) => !/walk/i.test(w.name))
                  const isToday = d.n === today
                  return (
                    <div key={d.n}>
                      <p className="text-[11px] font-semibold uppercase mb-1" style={{ color: isToday ? "#2dd4bf" : "#7e8a9e", letterSpacing: "0.1em" }}>
                        {dayLabel(d.n)}{isToday ? " · today" : ""}
                      </p>
                      {list.length === 0 ? (
                        <p className="text-[13px]" style={{ color: "#5a6578" }}>Walk only</p>
                      ) : (
                        <ul className="space-y-0.5">
                          {list.map((w, i) => (
                            <li key={i} className="flex items-baseline justify-between text-[13px]">
                              <button onClick={() => setViewing(w)} className="text-left" style={{ color: "#c9cdd5" }}>{w.name}</button>
                              <span className="tabular-nums text-[11px] ml-3 shrink-0" style={{ color: "#7e8a9e" }}>
                                {w.sets ? `${w.sets} × ` : ""}{w.reps || ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {sections.length > 0 && (
          <section className="rounded-2xl" style={card}>
            <button onClick={() => setGuideOpen((v) => !v)} className="w-full flex items-center justify-between p-4" aria-expanded={guideOpen}>
              <span className="text-sm font-medium" style={{ color: "#e8eaf0" }}>Notes from your coach</span>
              <ChevronDown size={16} style={{ color: "#5a6578", transform: guideOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {guideOpen && (
              <div className="px-4 pb-4 space-y-4">
                {sections.map((s, i) => (
                  <div key={i}>
                    {s.heading && <h4 className="text-sm font-semibold mb-1" style={{ color: "#e8eaf0" }}>{s.heading}</h4>}
                    {s.body && <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c9cdd5" }}>{s.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  )
}

/**
 * One exercise per screen. Big demo, the sets and reps, the coach's cue, and
 * one button. The last button ticks "Did today's exercises" on the daily log,
 * so finishing here and finishing on the Today tab are the same fact.
 */
function Walkthrough({
  exercises,
  log,
  onClose,
  onDone,
}: {
  exercises: WorkoutItem[]
  log: { mealsFollowed: number; steps: number | null }
  onClose: () => void
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const it = exercises[i]
  const last = i === exercises.length - 1

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const finish = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await saveDailyLog({
        date: localDate(),
        workoutDone: true,
        mealsFollowed: log.mealsFollowed,
        walkDone: (log.steps ?? 0) >= 3000,
        steps: log.steps,
      })
      if (res.success) onDone()
      else setError(res.error || "That didn't save. Tap Done again.")
    } catch {
      setError("That didn't save — you may have lost signal. Tap Done again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#090c14" }} role="dialog" aria-modal="true" aria-label="Today's exercises">
      <div className="flex items-center gap-3 px-5" style={{ paddingTop: "calc(16px + env(safe-area-inset-top, 0px))" }}>
        <button onClick={onClose} className="p-2 -ml-2 rounded-lg" aria-label="Close" style={{ color: "#7e8a9e" }}>
          <X size={22} />
        </button>
        <div className="flex-1 flex gap-1">
          {exercises.map((_, k) => (
            <span key={k} className="h-1 rounded-full flex-1" style={{ background: k <= i ? "#2dd4bf" : "rgba(255,255,255,0.10)" }} />
          ))}
        </div>
        <span className="text-[12px] tabular-nums" style={{ color: "#7e8a9e" }}>{i + 1} of {exercises.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 max-w-md mx-auto w-full">
        {/* Stills only, and only when there are some. The GIF route goes through
            a metered API that is currently exhausted, which rendered as a large
            blank white square — worse than no picture. */}
        {(it.imageStart || it.imageEnd) && (
          <div className="flex justify-center">
            <ExerciseDemo demo={null} start={it.imageStart} end={it.imageEnd} alt={it.name} size={240} rounded={24} interval={1000} />
          </div>
        )}
        <h2 className="mt-6 text-[24px] font-semibold" style={{ color: "#e8eaf0", lineHeight: 1.25 }}>{it.name}</h2>
        {(it.sets || it.reps) && (
          <p className="mt-2 text-[28px] tabular-nums" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#2dd4bf" }}>
            {it.sets ? `${it.sets} ${it.sets === 1 ? "set" : "sets"} × ` : ""}{it.reps || ""}
          </p>
        )}
        {it.notes && (
          <p className="mt-3 text-[15px]" style={{ color: "#a9b2c1", lineHeight: 1.6 }}>{it.notes}</p>
        )}
        <p className="mt-4 text-[12.5px]" style={{ color: "#5a6578", lineHeight: 1.5 }}>
          Rest 30 to 45 seconds between sets. Slow and steady beats fast and sloppy.
        </p>
      </div>

      <div className="px-5 max-w-md mx-auto w-full" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
        {error && <p className="text-xs mb-2" style={{ color: "#fb7185" }}>{error}</p>}
        <div className="flex gap-2">
          {i > 0 && (
            <button onClick={() => setI(i - 1)} className="h-13 w-13 rounded-full flex items-center justify-center" style={{ width: 52, height: 52, background: "rgba(255,255,255,0.06)", color: "#e8eaf0" }} aria-label="Previous">
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            disabled={saving}
            className="flex-1 rounded-full font-bold text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ height: 52, background: "#2dd4bf", color: "#06231f" }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : last ? <><Check size={18} /> Done — tick today</> : <>Next exercise <ChevronRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
