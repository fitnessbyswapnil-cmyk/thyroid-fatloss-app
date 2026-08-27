"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Apple, Dumbbell, FileText, Sparkles, ChevronRight } from "lucide-react"
import type { Plan, PlanType, WorkoutItem, MealItem } from "@/app/actions/plans"
import { MealDetail } from "@/components/dashboard/MealDetail"
import { ExerciseDemo } from "@/components/dashboard/ExerciseDemo"
import { ExerciseViewer } from "@/components/dashboard/ExerciseViewer"
import { DAYS, dayLabel, scheduledDays, sessionFor, todayDayOfWeek } from "@/lib/plans/schedule"
import { MealLogger } from "@/components/dashboard/MealLogger"

const META: Record<PlanType, { label: string; icon: typeof Apple; tint: string }> = {
  meal: { label: "Meal Plan", icon: Apple, tint: "#2dd4bf" },
  workout: { label: "Workout Plan", icon: Dumbbell, tint: "#34d399" },
}

export function PlanCard({ type, plan }: { type: PlanType; plan: Plan | null }) {
  const meta = META[type]
  const Icon = meta.icon
  const [active, setActive] = useState<WorkoutItem | null>(null)
  const [activeMeal, setActiveMeal] = useState<MealItem | null>(null)
  const today = todayDayOfWeek()
  const [selectedDay, setSelectedDay] = useState(today)

  return (
    <>
    {active && <ExerciseViewer item={active} onClose={() => setActive(null)} />}
    {activeMeal && <MealDetail item={activeMeal} onClose={() => setActiveMeal(null)} />}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(45, 212, 191, 0.12)" }}
          >
            <Icon size={20} style={{ color: meta.tint }} />
          </div>
          <div>
            <h3
              className="text-xl"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}
            >
              {plan?.title || meta.label}
            </h3>
            {plan && (
              <p className="text-xs" style={{ color: "#7e8a9e" }}>
                Updated {new Date(plan.updated_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {!plan ? (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <Sparkles size={28} style={{ color: "#404858" }} />
            <p className="text-sm" style={{ color: "#7e8a9e" }}>
              Your coach is preparing your plan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Weekly programme. The week strip is what makes this a schedule
                rather than a document — she taps a day and sees that session,
                defaulting to today. */}
            {(plan.content?.workoutItems?.length ?? 0) > 0 && (() => {
              const items = plan.content.workoutItems!
              const scheduled = scheduledDays(items)
              const unscheduledOnly = scheduled.size === 0
              const shown = unscheduledOnly ? items : sessionFor(items, selectedDay)
              const isToday = selectedDay === today

              return (
                <div className="space-y-3">
                  {/* Week strip — hidden when the coach hasn't scheduled anything,
                      since seven identical rest days would just look broken. */}
                  {!unscheduledOnly && (
                    <div className="flex gap-1.5">
                      {DAYS.map((d) => {
                        const has = scheduled.has(d.n)
                        const active = selectedDay === d.n
                        const isTodayCell = today === d.n
                        return (
                          <button
                            key={d.n}
                            onClick={() => setSelectedDay(d.n)}
                            className="flex-1 rounded-xl flex flex-col items-center justify-center gap-0.5"
                            style={{
                              height: 54,
                              background: active ? "rgba(45,212,191,0.16)" : has ? "rgba(255,255,255,0.04)" : "transparent",
                              border: `1px solid ${active ? "rgba(45,212,191,0.45)" : has ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
                            }}
                            aria-label={d.label}
                          >
                            <span className="text-[12px] font-semibold" style={{ color: active ? "#2dd4bf" : has ? "#e8eaf0" : "#5a6578" }}>
                              {d.short}
                            </span>
                            <span className="text-[8px] font-semibold" style={{ color: active ? "#2dd4bf" : has ? "#7e8a9e" : "#404858" }}>
                              {isTodayCell ? "TODAY" : has ? "•" : "rest"}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {!unscheduledOnly && (
                    <p className="text-[12px] px-0.5" style={{ color: "#7e8a9e" }}>
                      {shown.length > 0
                        ? `${isToday ? "Today" : dayLabel(selectedDay)} · ${shown.length} exercise${shown.length === 1 ? "" : "s"}`
                        : `${isToday ? "Today" : dayLabel(selectedDay)} is a rest day — recovery is part of the plan.`}
                    </p>
                  )}

                  <div className="space-y-2">
                    {shown.map((it, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(it)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-white/[0.06]"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                        aria-label={`View ${it.name} demo`}
                      >
                        <ExerciseDemo demo={it.demoUrl} start={it.imageStart} end={it.imageEnd} alt={it.name} size={48} rounded={10} />
                        <span className="flex-1 text-sm" style={{ color: "#e8eaf0" }}>{it.name}</span>
                        {(it.sets || it.reps) && (
                          <span className="text-xs tabular-nums shrink-0" style={{ color: "#7e8a9e" }}>
                            {it.sets ? `${it.sets} × ` : ""}{it.reps || ""}
                          </span>
                        )}
                        <ChevronRight size={16} className="shrink-0" style={{ color: "#4b5563" }} />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Structured meal items (built from the coach's food library) */}
            {(plan.content?.mealItems?.length ?? 0) > 0 && (
              <div className="space-y-2">
                {plan.content.mealItems!.map((it, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMeal(it)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-white/[0.06]"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                    aria-label={`${it.name} — recipe and alternatives`}
                  >
                    {it.meal && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase shrink-0" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}>
                        {it.meal}
                      </span>
                    )}
                    <span className="flex-1 text-sm" style={{ color: "#e8eaf0" }}>
                      {it.name}
                      <span className="text-xs ml-1.5" style={{ color: "#7e8a9e" }}>
                        {it.qty && it.qty !== 1 ? `${it.qty} × ` : ""}{it.portion}
                      </span>
                    </span>
                    {it.calories != null && (
                      <span className="text-xs tabular-nums shrink-0" style={{ color: "#7e8a9e" }}>
                        {Math.round((it.calories || 0) * (it.qty || 1))} kcal
                      </span>
                    )}
                    <ChevronRight size={15} className="shrink-0" style={{ color: "#4b5563" }} />
                  </button>
                ))}
                {(() => {
                  /* A plan can be a single day ("Breakfast", "Lunch") or a menu
                     of alternatives ("Breakfast — option 3"). Summing every row
                     is right for the first and badly wrong for the second: a
                     3-meal plan with 10 options each totalled all 30 and showed
                     an 1,800 kcal day as 18,000.

                     So total each named meal, then average the options within a
                     slot and add the slots together. With no options present
                     every slot has one entry and this is the plain sum. */
                  const byMeal = new Map<string, { kcal: number; p: number }>()
                  for (const m of plan.content.mealItems!) {
                    const key = (m.meal || "").trim() || "—"
                    const q = m.qty || 1
                    const cur = byMeal.get(key) || { kcal: 0, p: 0 }
                    cur.kcal += (m.calories || 0) * q
                    cur.p += (Number(m.protein) || 0) * q
                    byMeal.set(key, cur)
                  }
                  const bySlot = new Map<string, { kcal: number; p: number; n: number }>()
                  for (const [meal, v] of byMeal) {
                    const slot = meal.split(" — ")[0].trim()
                    const cur = bySlot.get(slot) || { kcal: 0, p: 0, n: 0 }
                    cur.kcal += v.kcal
                    cur.p += v.p
                    cur.n += 1
                    bySlot.set(slot, cur)
                  }
                  let kcal = 0, p = 0, options = false
                  for (const v of bySlot.values()) {
                    if (v.n > 1) options = true
                    kcal += v.kcal / v.n
                    p += v.p / v.n
                  }
                  return kcal > 0 ? (
                    <p className="text-right text-xs tabular-nums pr-1" style={{ color: "#2dd4bf" }}>
                      Day total ≈ {Math.round(kcal)} kcal · {p.toFixed(0)}g protein
                      {options ? " · any one option per meal" : ""}
                    </p>
                  ) : null
                })()}

                {/* Tick off the meal slots the coach actually planned. Uses the
                    plan's own grouping, so it always matches what she was given. */}
                <MealLogger
                  meals={[...new Set(
                    plan.content.mealItems!.map((m) => (m.meal || "").trim()).filter(Boolean)
                  )]}
                />
              </div>
            )}

            {plan.content?.sections?.length > 0 ? (
              plan.content.sections.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <h4 className="text-sm font-semibold mb-1" style={{ color: "#e8eaf0" }}>
                      {section.heading}
                    </h4>
                  )}
                  {section.body && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c9cdd5" }}>
                      {section.body}
                    </p>
                  )}
                </div>
              ))
            ) : (
              !plan.file_path &&
              !(plan.content?.workoutItems?.length || plan.content?.mealItems?.length) && (
                <p className="text-sm" style={{ color: "#7e8a9e" }}>
                  Your coach is preparing your plan.
                </p>
              )
            )}

            {plan.file_path && (
              <a
                href={`/api/file?pathname=${encodeURIComponent(plan.file_path)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium mt-2"
                style={{ background: "rgba(45, 212, 191, 0.12)", color: "#2dd4bf" }}
              >
                <FileText size={16} />
                Open attached PDF
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
    </>
  )
}
