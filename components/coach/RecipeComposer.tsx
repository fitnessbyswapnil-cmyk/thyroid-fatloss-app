"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Trash2, Loader2, Check, X, FlaskConical } from "lucide-react"
import { lookupIngredients, saveComposedFood } from "@/app/actions/nutrition"
import type { Ingredient, RecipePart } from "@/lib/nutrition/ifct"

const inputStyle = { background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" } as const

/**
 * Compose a library food from measured ingredients.
 *
 * Two things this fixes at once: macros stop being hand-typed guesses, and the
 * ingredient list doubles as the recipe the client sees on her plan.
 */
export function RecipeComposer({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [portion, setPortion] = useState("")
  const [tags, setTags] = useState("")
  const [isVeg, setIsVeg] = useState(true)
  const [method, setMethod] = useState("")
  const [parts, setParts] = useState<RecipePart[]>([])
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Ingredient[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const search = async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    setResults(await lookupIngredients(query))
    setSearching(false)
  }

  const add = (ing: Ingredient) => {
    setParts((p) => [...p, {
      name: ing.name, grams: 100,
      kcal: ing.kcal, protein: ing.protein, carbs: ing.carbs, fats: ing.fats,
      source: ing.energyBasis === "derived" ? "IFCT 2017 (energy derived)" : "IFCT 2017",
    }])
    setResults([])
    setQuery("")
  }

  // Live preview mirrors the server-side computeRecipe so what she sees is what saves.
  const totals = parts.reduce(
    (acc, p) => {
      const f = (Number(p.grams) || 0) / 100
      return {
        calories: acc.calories + p.kcal * f,
        protein: acc.protein + p.protein * f,
        carbs: acc.carbs + p.carbs * f,
        fats: acc.fats + p.fats * f,
        grams: acc.grams + (Number(p.grams) || 0),
      }
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0, grams: 0 }
  )

  const save = async () => {
    setSaving(true); setErr(null)
    const res = await saveComposedFood({
      name, portion, parts, recipe: method, tags, isVeg,
    })
    setSaving(false)
    if (!res.success) { setErr(res.error || "Could not save"); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ background: "rgba(28, 29, 32, 0.45)", backdropFilter: "blur(6px)" }} onClick={() => !saving && onClose()}>
      <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 tw-fade-up"
        style={{ background: "#ffffff", border: "1px solid #cfc7b6" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl" style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", color: "#1c1d20" }}>
            Build from ingredients
          </h3>
          <button onClick={onClose} style={{ color: "#8b867c" }} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="text-[12px] mb-4" style={{ color: "#8b867c" }}>
          Macros are computed from measured values — no guessing.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dish name" className="col-span-2 px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          <input value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="Portion (e.g. 1 katori)" className="px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (lunch, high-protein)" className="px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
        </div>
        <label className="flex items-center gap-2 text-[12.5px] mb-4" style={{ color: "#5a564e" }}>
          <input type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} style={{ accentColor: "#155e56" }} /> Vegetarian
        </label>

        {/* Ingredient search */}
        <div className="flex gap-2 mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search ingredient (paneer, moong, oil…)"
            className="flex-1 px-3 py-2.5 rounded-lg text-sm"
            style={inputStyle}
          />
          <button onClick={search} className="px-3 rounded-lg" style={{ background: "rgba(21, 94, 86,0.12)", color: "#155e56" }} aria-label="Search">
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-1 mb-3 max-h-44 overflow-y-auto">
            {results.map((r) => (
              <button key={r.code + r.name} onClick={() => add(r)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-white/5">
                <span className="flex-1 text-[13px] truncate" style={{ color: "#1c1d20" }}>{r.name}</span>
                <span className="text-[11px] tabular-nums shrink-0" style={{ color: "#8b867c" }}>
                  {r.kcal} kcal · P{r.protein} /100g
                </span>
                <Plus size={13} style={{ color: "#155e56" }} />
              </button>
            ))}
          </div>
        )}

        {/* Chosen ingredients */}
        {parts.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {parts.map((p, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
                <span className="flex-1 min-w-0 text-[13px] truncate" style={{ color: "#1c1d20" }}>{p.name}</span>
                <input
                  value={p.grams}
                  onChange={(e) => setParts((prev) => prev.map((x, idx) => idx === i ? { ...x, grams: Number(e.target.value) || 0 } : x))}
                  inputMode="numeric"
                  className="w-16 px-2 py-1.5 rounded-lg text-[13px] text-right tabular-nums"
                  style={inputStyle}
                  aria-label={`${p.name} grams`}
                />
                <span className="text-[11px]" style={{ color: "#a09a8e" }}>g</span>
                <button onClick={() => setParts((prev) => prev.filter((_, idx) => idx !== i))} style={{ color: "#a09a8e" }} aria-label="Remove"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Live totals */}
        {parts.length > 0 && (
          <div className="p-3.5 rounded-2xl mb-3" style={{ background: "rgba(21, 94, 86,0.07)", border: "1px solid rgba(21, 94, 86,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={13} style={{ color: "#155e56" }} />
              <span className="text-[10.5px] uppercase font-semibold" style={{ color: "#155e56", letterSpacing: "0.14em" }}>Computed</span>
            </div>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 24, color: "#1c1d20" }}>
              {Math.round(totals.calories)} kcal
            </p>
            <p className="text-[12px] tabular-nums" style={{ color: "#5a564e" }}>
              P {totals.protein.toFixed(1)}g · C {totals.carbs.toFixed(1)}g · F {totals.fats.toFixed(1)}g · {Math.round(totals.grams)}g total
            </p>
          </div>
        )}

        <textarea
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          rows={3}
          placeholder="How to make it (optional) — the client sees this on her plan"
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none mb-3"
          style={inputStyle}
        />

        {err && <p className="text-xs mb-2" style={{ color: "#9a3b2e" }}>{err}</p>}

        <button onClick={save} disabled={saving || !name.trim() || parts.length === 0}
          className="w-full h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2"
          style={{ background: "#155e56", color: "#dfe7dd", opacity: !name.trim() || parts.length === 0 ? 0.5 : 1 }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />} Save to library
        </button>
        <p className="text-[10.5px] text-center mt-3" style={{ color: "#a09a8e" }}>
          Ingredient values from IFCT 2017 (ICMR-NIN). Raw-weight arithmetic — cooking losses aren&rsquo;t modelled.
        </p>
      </div>
    </div>
  )
}
