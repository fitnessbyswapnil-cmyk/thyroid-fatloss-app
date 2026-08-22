"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Loader2, Repeat, Leaf, Drumstick, UtensilsCrossed } from "lucide-react"
import { getFoodDetail, getSwapOptions, type FoodDetail, type SwapOption } from "@/app/actions/nutrition"
import type { MealItem } from "@/app/actions/plans"

/**
 * What a client sees when she taps a meal: what's actually in it, how to make
 * it, and — if today isn't going to work — what she can eat instead.
 *
 * The swap list is the point. Without it, "I don't have those ingredients"
 * means skipping the meal and quietly falling off the plan.
 */
export function MealDetail({ item, onClose }: { item: MealItem; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [detail, setDetail] = useState<FoodDetail | null>(null)
  const [swaps, setSwaps] = useState<SwapOption[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSwaps, setLoadingSwaps] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const d = await getFoodDetail(item.name)
      if (!cancelled) { setDetail(d); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [item.name])

  const loadSwaps = async () => {
    setLoadingSwaps(true)
    setSwaps(await getSwapOptions(item.name, item.meal))
    setLoadingSwaps(false)
  }

  if (!mounted) return null

  const qty = item.qty || 1
  const kcal = item.calories != null ? Math.round(item.calories * qty) : null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(28, 29, 32, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose} role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 tw-fade-up"
        style={{ background: "#ffffff", border: "1px solid #cfc7b6" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-[26px] leading-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", color: "#1c1d20" }}>
            {item.name}
          </h3>
          <button onClick={onClose} style={{ color: "#8b867c" }} aria-label="Close"><X size={18} /></button>
        </div>

        <p className="text-[12.5px]" style={{ color: "#5a564e" }}>
          {qty !== 1 ? `${qty} × ` : ""}{item.portion}
          {item.meal ? ` · ${item.meal}` : ""}
        </p>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            ["kcal", kcal],
            ["Protein", item.protein != null ? `${Math.round(item.protein * qty)}g` : null],
            ["Carbs", item.carbs != null ? `${Math.round(item.carbs * qty)}g` : null],
            ["Fats", item.fats != null ? `${Math.round(item.fats * qty)}g` : null],
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded-xl p-2.5 text-center" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
              <p className="tabular-nums" style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 18, color: "#1c1d20" }}>
                {val ?? "—"}
              </p>
              <p className="text-[9px] font-semibold mt-0.5" style={{ color: "#8b867c" }}>{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: "#155e56" }} /></div>
        ) : (
          <>
            {/* Ingredients — the recipe, when the coach composed this dish */}
            {detail?.ingredients?.length ? (
              <div className="mt-5">
                <p className="text-[10.5px] uppercase font-semibold mb-2" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>
                  What&rsquo;s in it
                </p>
                <div className="space-y-1.5">
                  {detail.ingredients.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "#ffffff", border: "1px solid #f4f0e8" }}>
                      <span className="flex-1 text-[13px]" style={{ color: "#5a564e" }}>{g.name}</span>
                      <span className="text-[12px] tabular-nums" style={{ color: "#1c1d20" }}>{g.grams} g</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {detail?.recipe ? (
              <div className="mt-4">
                <p className="text-[10.5px] uppercase font-semibold mb-2" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>
                  How to make it
                </p>
                <p className="text-[13.5px] whitespace-pre-wrap" style={{ color: "#3c3a34", lineHeight: 1.65 }}>{detail.recipe}</p>
              </div>
            ) : null}

            {!detail?.ingredients?.length && !detail?.recipe && (
              <div className="mt-5 flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ background: "#ffffff" }}>
                <UtensilsCrossed size={14} style={{ color: "#a09a8e", marginTop: 2 }} />
                <p className="text-[12px]" style={{ color: "#8b867c", lineHeight: 1.5 }}>
                  No recipe saved for this one yet — ask your coach if you&rsquo;re unsure how to prepare it.
                </p>
              </div>
            )}
          </>
        )}

        {/* Swap */}
        <div className="mt-6">
          {swaps === null ? (
            <button onClick={loadSwaps} disabled={loadingSwaps}
              className="w-full h-12 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2"
              style={{ background: "rgba(21, 94, 86,0.12)", color: "#155e56", border: "1px solid rgba(21, 94, 86,0.28)" }}>
              {loadingSwaps ? <Loader2 size={15} className="animate-spin" /> : <Repeat size={15} />}
              Can&rsquo;t eat this today?
            </button>
          ) : (
            <>
              <p className="text-[10.5px] uppercase font-semibold mb-2" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>
                Similar options
              </p>
              {swaps.length === 0 ? (
                <p className="text-[12.5px]" style={{ color: "#8b867c", lineHeight: 1.5 }}>
                  No close match in your plan&rsquo;s library — message your coach and she&rsquo;ll sort it.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {swaps.map((s) => (
                    <div key={s.id} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                      style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
                      {s.is_veg
                        ? <Leaf size={13} className="shrink-0" style={{ color: "#155e56" }} />
                        : <Drumstick size={13} className="shrink-0" style={{ color: "#9a3b2e" }} />}
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] truncate" style={{ color: "#1c1d20" }}>{s.name}</span>
                        <span className="block text-[11px] truncate" style={{ color: "#8b867c" }}>{s.portion}</span>
                      </span>
                      <span className="text-[11.5px] tabular-nums shrink-0" style={{ color: "#5a564e" }}>
                        {s.calories ?? "—"} kcal
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10.5px] mt-3" style={{ color: "#a09a8e", lineHeight: 1.5 }}>
                Matched on meal type and calories from your coach&rsquo;s library — swapping within these keeps you on plan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
