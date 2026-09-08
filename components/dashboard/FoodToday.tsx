"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, FileText, RefreshCw, Sparkles } from "lucide-react"
import type { MealItem, PlanSection } from "@/app/actions/plans"
import type { TodayMeal, MealOption } from "@/lib/plans/today"
import { MealDetail } from "@/components/dashboard/MealDetail"

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const
const localDate = () => new Date().toLocaleDateString("en-CA")
const KEY = () => `thyrowell.food.${localDate()}`

/**
 * Today's meals, one card per slot, with the other options folded behind Swap.
 *
 * A swap is remembered for the day on this phone only — it is her choice of
 * what to cook, not a fact the coach needs. The stored value is the option's
 * label, so a plan edit that reorders options cannot silently move her pick.
 */
export function FoodToday({
  title,
  updatedAt,
  meals,
  sections,
  filePath,
  hasPlan,
}: {
  title: string
  updatedAt: string | null
  meals: TodayMeal[]
  sections: PlanSection[]
  filePath: string | null
  hasPlan: boolean
}) {
  const [chosen, setChosen] = useState<Record<string, string>>({})
  const [swapping, setSwapping] = useState<string | null>(null)
  const [detail, setDetail] = useState<MealItem | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY())
      if (raw) setChosen(JSON.parse(raw))
    } catch {}
  }, [])

  const choose = (slot: string, label: string) => {
    const next = { ...chosen, [slot]: label }
    setChosen(next)
    setSwapping(null)
    try {
      window.localStorage.setItem(KEY(), JSON.stringify(next))
    } catch {}
  }

  const current = (m: TodayMeal): MealOption | null =>
    m.options.find((o) => o.label === chosen[m.slot]) || m.pick

  const dayTotal = meals.reduce(
    (a, m) => {
      const c = current(m)
      return c ? { kcal: a.kcal + c.kcal, protein: a.protein + c.protein } : a
    },
    { kcal: 0, protein: 0 }
  )

  return (
    <>
      {detail && <MealDetail item={detail} onClose={() => setDetail(null)} />}

      <header className="max-w-2xl mx-auto px-5" style={{ paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.16em" }}>
          Food · {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
        </p>
        <h1 className="mt-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontSize: 30, lineHeight: 1.15, color: "#e8eaf0" }}>
          Eat this today
        </h1>
        {hasPlan ? (
          <p className="text-sm mt-1.5" style={{ color: "#a9b2c1", lineHeight: 1.55 }}>
            Tap a meal for the recipe and portions. Tap Swap to pick a different option for that meal.
            {dayTotal.kcal > 0 && (
              <span className="block text-[12px] mt-1 tabular-nums" style={{ color: "#5a6578" }}>
                Today as chosen ≈ {dayTotal.kcal} kcal · {dayTotal.protein}g protein
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm mt-1.5" style={{ color: "#a9b2c1" }}>Your coach is preparing your plan. It will appear here.</p>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-5 mt-6 space-y-3">
        {!hasPlan && (
          <div className="flex flex-col items-center text-center py-10 gap-3 rounded-2xl" style={card}>
            <Sparkles size={26} style={{ color: "#404858" }} />
            <p className="text-sm" style={{ color: "#7e8a9e" }}>Nothing here yet.</p>
          </div>
        )}

        {meals.map((m) => {
          const c = current(m)
          const isOpen = swapping === m.slot
          const others = m.options.filter((o) => o.label !== c?.label)
          return (
            <section key={m.slot} id={m.slot.toLowerCase()} className="rounded-2xl overflow-hidden" style={card}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase" style={{ color: "#7e8a9e", letterSpacing: "0.1em" }}>{m.slot}</span>
                  {c && (
                    <span className="text-[11px] tabular-nums" style={{ color: "#5a6578" }}>
                      {c.kcal} kcal · {c.protein}g protein
                    </span>
                  )}
                </div>

                {c ? (
                  <ul className="mt-2 space-y-1">
                    {c.items.map((it, i) => (
                      <li key={i}>
                        <button
                          onClick={() => setDetail(it)}
                          className="w-full flex items-center gap-3 py-2 text-left"
                          aria-label={`${it.name} — recipe`}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block text-[15px]" style={{ color: "#e8eaf0" }}>{it.name}</span>
                            <span className="block text-[12px] mt-0.5" style={{ color: "#7e8a9e" }}>
                              {it.qty && it.qty !== 1 ? `${it.qty} × ` : ""}{it.portion}
                            </span>
                          </span>
                          <ChevronRight size={16} className="shrink-0" style={{ color: "#4b5563" }} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm mt-2" style={{ color: "#7e8a9e" }}>Not set yet</p>
                )}

                {others.length > 0 && (
                  <button
                    onClick={() => setSwapping(isOpen ? null : m.slot)}
                    className="mt-3 h-10 px-4 rounded-full text-[13px] font-semibold inline-flex items-center gap-2"
                    style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}
                    aria-expanded={isOpen}
                  >
                    <RefreshCw size={14} /> {isOpen ? "Keep this one" : `Swap · ${others.length} other option${others.length === 1 ? "" : "s"}`}
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                  {others.map((o) => (
                    <button
                      key={o.label}
                      onClick={() => choose(m.slot, o.label)}
                      className="w-full text-left p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="block text-[14px]" style={{ color: "#e8eaf0", lineHeight: 1.4 }}>
                        {o.items.map((x) => x.name).join(" · ")}
                      </span>
                      <span className="block text-[11px] mt-1 tabular-nums" style={{ color: "#5a6578" }}>
                        {o.kcal} kcal · {o.protein}g protein · tap to choose
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        {(sections.length > 0 || filePath) && (
          <section className="rounded-2xl" style={card}>
            <button
              onClick={() => setGuideOpen((v) => !v)}
              className="w-full flex items-center justify-between p-4"
              aria-expanded={guideOpen}
            >
              <span className="text-sm font-medium" style={{ color: "#e8eaf0" }}>How to follow this plan</span>
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
                {filePath && (
                  <a
                    href={`/api/file?pathname=${encodeURIComponent(filePath)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}
                  >
                    <FileText size={16} /> Open the PDF
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        {hasPlan && updatedAt && (
          <p className="text-[11px] text-center pt-2" style={{ color: "#5a6578" }}>
            {title} · updated {new Date(updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
        )}
      </main>
    </>
  )
}
