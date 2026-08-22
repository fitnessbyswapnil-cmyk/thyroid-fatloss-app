"use client"

import { useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Apple, Dumbbell, Plus, Trash2, FileText, Loader2, Check, Upload, X,
  Search, BookmarkPlus, FolderOpen, Video, Wand2,
} from "lucide-react"
import { savePlan, type Plan, type PlanType, type PlanSection, type WorkoutItem, type MealItem } from "@/app/actions/plans"
import { listExercises, listFoods, type Exercise, type Food } from "@/app/actions/library"
import { listTemplates, saveTemplate, deleteTemplate, type PlanTemplate } from "@/app/actions/templates"
import { ExerciseDemo } from "@/components/dashboard/ExerciseDemo"
import { DAYS, dayLabel, inferDayOfWeek } from "@/lib/plans/schedule"
import { generateMealPlan, getClientTargets, saveClientMetrics } from "@/app/actions/nutrition"
import { ACTIVITY, type ActivityLevel } from "@/lib/plans/targets"

const META: Record<PlanType, { label: string; icon: typeof Apple; tint: string }> = {
  meal: { label: "Meal Plan", icon: Apple, tint: "#2dd4bf" },
  workout: { label: "Workout Plan", icon: Dumbbell, tint: "#34d399" },
}

const inputStyle = {
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  color: "#e8eaf0",
} as const

/** A single equipment/muscle filter pill in the library picker. */
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
      style={
        active
          ? { background: "#2dd4bf", color: "#04121a" }
          : { background: "rgba(255,255,255,0.05)", color: "#c9cdd5", border: "1px solid rgba(255,255,255,0.08)" }
      }
    >
      {children}
    </button>
  )
}

export function PlanEditor({ clientId, type, plan }: { clientId: string; type: PlanType; plan: Plan | null }) {
  const router = useRouter()
  const meta = META[type]
  const Icon = meta.icon
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(plan?.title || meta.label)
  const [sections, setSections] = useState<PlanSection[]>(
    plan?.content?.sections?.length ? plan.content.sections : [{ heading: "", body: "" }]
  )
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>(plan?.content?.workoutItems || [])
  const [mealItems, setMealItems] = useState<MealItem[]>(plan?.content?.mealItems || [])
  const [filePath, setFilePath] = useState<string | null>(plan?.file_path ?? null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Library picker (lazy-loaded once per editor)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [libLoaded, setLibLoaded] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [foods, setFoods] = useState<Food[]>([])
  const [libSearch, setLibSearch] = useState("")
  const [libEquip, setLibEquip] = useState<string | null>(null)   // equipment filter
  const [libMuscle, setLibMuscle] = useState<string | null>(null) // muscle-group filter
  const [libVeg, setLibVeg] = useState<"veg" | "nonveg" | null>(null) // foods filter

  // Templates
  const [templates, setTemplates] = useState<PlanTemplate[] | null>(null)
  const [tplOpen, setTplOpen] = useState(false)
  const [tplSaving, setTplSaving] = useState(false)

  // --- Auto-draft state ---
  const [genOpen, setGenOpen] = useState(false)
  const [genKcal, setGenKcal] = useState("1400")
  const [genProtein, setGenProtein] = useState("90")
  const [genVeg, setGenVeg] = useState(true)
  const [genVariety, setGenVariety] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<Awaited<ReturnType<typeof generateMealPlan>>>(null)
  const [targets, setTargets] = useState<Awaited<ReturnType<typeof getClientTargets>>>(null)
  const [targetsLoaded, setTargetsLoaded] = useState(false)
  const [heightInput, setHeightInput] = useState("")
  const [activityInput, setActivityInput] = useState<ActivityLevel>("light")
  const [savingMetrics, setSavingMetrics] = useState(false)

  /** Work the targets out from her record the first time the panel opens. */
  const openGenerator = async () => {
    const next = !genOpen
    setGenOpen(next)
    if (!next || targetsLoaded) return
    setTargetsLoaded(true)
    const t = await getClientTargets(clientId)
    if (!t) return
    setTargets(t)
    setGenKcal(String(t.calories))
    setGenProtein(String(t.protein))
  }

  const applyMetrics = async () => {
    setSavingMetrics(true)
    const res = await saveClientMetrics({
      clientId,
      heightCm: heightInput ? Number(heightInput) : null,
      activityLevel: activityInput,
    })
    if (res?.success) {
      const t = await getClientTargets(clientId)
      if (t) { setTargets(t); setGenKcal(String(t.calories)); setGenProtein(String(t.protein)) }
      setHeightInput("")
    }
    setSavingMetrics(false)
  }

  const runGenerate = async (variety: number) => {
    setGenerating(true)
    setGenVariety(variety)
    const res = await generateMealPlan({
      clientId,
      targetCalories: Number(genKcal) || 1400,
      targetProtein: Number(genProtein) || 90,
      isVeg: genVeg,
      variety,
    })
    setGenerating(false)
    if (!res) return
    setGenResult(res)
    // Replace rather than append: "Another" should give a fresh day, not stack
    // a second one on top of the first.
    setMealItems(res.items.map((i) => ({
      foodId: i.foodId, name: i.name, portion: i.portion, qty: i.qty, meal: i.meal,
      calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats,
    })))
  }

  const openPicker = async () => {
    setPickerOpen(true)
    if (!libLoaded) {
      if (type === "workout") setExercises(await listExercises())
      else setFoods(await listFoods())
      setLibLoaded(true)
    }
  }

  const openTemplates = async () => {
    setTplOpen((v) => !v)
    if (templates === null) setTemplates(await listTemplates(type))
  }

  const updateSection = (i: number, field: keyof PlanSection, value: string) =>
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  const addSection = () => setSections((prev) => [...prev, { heading: "", body: "" }])
  const removeSection = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i))

  const addExercise = (e: Exercise) => {
    setWorkoutItems((prev) => [...prev, {
      exerciseId: e.id, name: e.name, sets: 3, reps: "10", day: "",
      videoUrl: e.video_url, demoUrl: e.demo_url, imageStart: e.image_start, imageEnd: e.image_end, notes: e.cues || null,
    }])
    setPickerOpen(false); setLibSearch("")
  }
  const addFood = (f: Food) => {
    setMealItems((prev) => [...prev, {
      foodId: f.id, name: f.name, portion: f.portion, qty: 1, meal: "",
      calories: f.calories, protein: f.protein, carbs: f.carbs, fats: f.fats,
    }])
    setPickerOpen(false); setLibSearch("")
  }

  const totals = mealItems.reduce(
    (t, m) => {
      const q = m.qty || 1
      return {
        kcal: t.kcal + (m.calories || 0) * q,
        p: t.p + (Number(m.protein) || 0) * q,
        c: t.c + (Number(m.carbs) || 0) * q,
        f: t.f + (Number(m.fats) || 0) * q,
      }
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  )

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") { setError("Only PDF files are allowed"); return }
    setError(null); setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", `plan-${type}`)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed")
      const { pathname } = await res.json()
      setFilePath(pathname)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally { setUploading(false) }
  }

  const currentContent = () => ({
    sections: sections.filter((s) => s.heading.trim() || s.body.trim()),
    ...(type === "workout" && workoutItems.length ? { workoutItems } : {}),
    ...(type === "meal" && mealItems.length ? { mealItems } : {}),
  })

  const handleSave = async () => {
    setSaving(true); setError(null)
    const result = await savePlan({
      clientId, type, title, sections,
      workoutItems: type === "workout" ? workoutItems : [],
      mealItems: type === "meal" ? mealItems : [],
      filePath,
    })
    setSaving(false)
    if (result.success) {
      setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh()
    } else setError(result.error || "Failed to save")
  }

  const handleSaveTemplate = async () => {
    setTplSaving(true)
    const res = await saveTemplate({ type, title, content: currentContent() })
    setTplSaving(false)
    if (res.success) setTemplates(await listTemplates(type))
    else setError(res.error || "Failed to save template")
  }

  const applyTemplate = (t: PlanTemplate) => {
    setTitle(t.title)
    setSections(t.content.sections?.length ? t.content.sections : [{ heading: "", body: "" }])
    if (type === "workout") setWorkoutItems(t.content.workoutItems || [])
    else setMealItems(t.content.mealItems || [])
    setTplOpen(false)
  }

  const removeTemplate = async (id: string) => {
    await deleteTemplate(id)
    setTemplates(await listTemplates(type))
  }

  const lib = type === "workout" ? exercises : foods

  // Expert picker facets — derived live from the loaded library so chips only
  // ever show values the coach actually has exercises for (Fittr-style).
  const equipOptions =
    type === "workout"
      ? Array.from(new Set(exercises.map((e) => e.equipment?.trim()).filter(Boolean) as string[])).sort()
      : []
  const muscleOptions =
    type === "workout"
      ? Array.from(new Set(exercises.map((e) => e.muscle_group?.trim()).filter(Boolean) as string[])).sort()
      : []

  const libFiltered = (lib as Array<Exercise | Food>).filter((x) => {
    if (libSearch && !x.name.toLowerCase().includes(libSearch.toLowerCase())) return false
    if (type === "workout") {
      const e = x as Exercise
      if (libEquip && e.equipment?.trim() !== libEquip) return false
      if (libMuscle && e.muscle_group?.trim() !== libMuscle) return false
    } else {
      const f = x as Food
      if (libVeg === "veg" && !f.is_veg) return false
      if (libVeg === "nonveg" && f.is_veg) return false
    }
    return true
  })

  return (
    <div className="p-6 rounded-2xl" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(45, 212, 191, 0.12)" }}>
            <Icon size={18} style={{ color: meta.tint }} />
          </div>
          <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>{meta.label}</h3>
        </div>
        {/* Templates */}
        <div className="relative">
          <button onClick={openTemplates} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#c9cdd5" }}>
            <FolderOpen size={14} /> Templates
          </button>
          {tplOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl p-2 z-20" style={{ background: "#0d111b", border: "1px solid rgba(255,255,255,0.1)" }}>
              {(templates || []).length === 0 && <p className="text-xs p-2" style={{ color: "#7e8a9e" }}>No templates yet.</p>}
              {(templates || []).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                  <button onClick={() => applyTemplate(t)} className="text-xs text-left flex-1" style={{ color: "#e8eaf0" }}>{t.title}</button>
                  <button onClick={() => removeTemplate(t.id)} aria-label="Delete template" style={{ color: "#fb7185" }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <label className="block text-xs uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-5" style={inputStyle} placeholder={meta.label} />

      {/* ── Library items ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
            {type === "workout" ? "Exercises" : "Foods"} (from library)
          </label>
          <div className="flex items-center gap-3">
            {type === "meal" && (
              <button onClick={openGenerator} className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#a78bfa" }}>
                <Wand2 size={14} /> Draft a day
              </button>
            )}
            <button onClick={openPicker} className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#2dd4bf" }}>
              <Plus size={14} /> Add from library
            </button>
          </div>
        </div>

        {/* Auto-draft a day's meals from the library to hit a calorie/protein
            target. Replaces the tedious part of plan-writing, not the judgement:
            it fills the editor and the coach edits before assigning. */}
        {type === "meal" && genOpen && (
          <div className="p-3.5 rounded-xl mb-3" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.22)" }}>
            {/* Why these numbers. Shown so the coach can judge the estimate
                rather than trust it, and override it knowing what she is
                overriding. */}
            {targets && (
              <div className="mb-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[11px] uppercase mb-1.5" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>How this was worked out</p>
                {targets.reasoning.map((r, i) => (
                  <p key={i} className="text-[11.5px]" style={{ color: "#a9b2c1", lineHeight: 1.55 }}>{r}</p>
                ))}
                {targets.flooredAt && (
                  <p className="text-[11.5px] mt-1" style={{ color: "#f59e0b", lineHeight: 1.5 }}>
                    Held at the {targets.flooredAt} kcal floor.
                  </p>
                )}
              </div>
            )}

            {/* Height changes the estimate by up to 11%, so ask for it once
                rather than quietly guessing on every plan. */}
            {targets?.missing?.includes("height") && (
              <div className="mb-3 px-3 py-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.22)" }}>
                <p className="text-[12px] mb-2" style={{ color: "#e8eaf0", lineHeight: 1.5 }}>
                  Her height isn&rsquo;t on file, so this is estimated from weight alone — it can be out by around 10%.
                </p>
                <div className="flex items-center gap-2">
                  <input value={heightInput} onChange={(e) => setHeightInput(e.target.value)} inputMode="numeric"
                    placeholder="Height in cm" className="flex-1 px-2.5 py-2 rounded-lg text-sm tabular-nums" style={inputStyle} />
                  <select value={activityInput} onChange={(e) => setActivityInput(e.target.value as ActivityLevel)}
                    className="px-2 py-2 rounded-lg text-[12px]" style={inputStyle}>
                    {ACTIVITY.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                  <button onClick={applyMetrics} disabled={savingMetrics || !heightInput}
                    className="px-3 h-9 rounded-lg text-[12px] font-semibold"
                    style={{ background: "rgba(245,158,11,0.16)", color: "#f59e0b" }}>
                    {savingMetrics ? "…" : "Save"}
                  </button>
                </div>
                <p className="text-[10.5px] mt-1.5" style={{ color: "#7e8a9e" }}>Saved to her profile — you only enter it once.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div>
                <label className="block text-[10px] uppercase mb-1" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Calories</label>
                <input value={genKcal} onChange={(e) => setGenKcal(e.target.value)} inputMode="numeric" placeholder="1400" className="w-full px-2.5 py-2 rounded-lg text-sm tabular-nums" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[10px] uppercase mb-1" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Protein (g)</label>
                <input value={genProtein} onChange={(e) => setGenProtein(e.target.value)} inputMode="numeric" placeholder="90" className="w-full px-2.5 py-2 rounded-lg text-sm tabular-nums" style={inputStyle} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[12px] mb-2.5" style={{ color: "#a9b2c1" }}>
              <input type="checkbox" checked={genVeg} onChange={(e) => setGenVeg(e.target.checked)} style={{ accentColor: "#a78bfa" }} />
              Vegetarian
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => runGenerate(0)} disabled={generating}
                className="flex-1 h-10 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: "#a78bfa", color: "#1a1033" }}>
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Generate
              </button>
              {genResult && (
                <button onClick={() => runGenerate(genVariety + 1)} disabled={generating}
                  className="h-10 px-3 rounded-lg text-[12px] font-semibold"
                  style={{ background: "rgba(167,139,250,0.14)", color: "#a78bfa" }}>
                  Another
                </button>
              )}
            </div>
            {genResult && (
              <div className="mt-2.5">
                <p className="text-[12px] tabular-nums" style={{ color: "#e8eaf0" }}>
                  {genResult.totals.calories} kcal · P {genResult.totals.protein}g · C {genResult.totals.carbs}g · F {genResult.totals.fats}g
                </p>
                {genResult.excluded?.length > 0 && (
                  <p className="text-[11px] mt-1" style={{ color: "#7e8a9e" }}>
                    Avoided from her profile: {genResult.excluded.join(", ")}
                  </p>
                )}
                {genResult.warnings.map((w: string, i: number) => (
                  <p key={i} className="text-[11px] mt-1" style={{ color: "#f59e0b" }}>{w}</p>
                ))}
                <p className="text-[10.5px] mt-2" style={{ color: "#5a6578" }}>
                  Drafted into the list below — edit anything before saving.
                </p>
              </div>
            )}
          </div>
        )}

        {pickerOpen && (
          <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(45,212,191,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Search size={14} style={{ color: "#7e8a9e" }} />
              <input autoFocus value={libSearch} onChange={(e) => setLibSearch(e.target.value)} placeholder="Search library…" className="flex-1 px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
              <button onClick={() => setPickerOpen(false)} style={{ color: "#7e8a9e" }} aria-label="Close picker"><X size={14} /></button>
            </div>

            {/* Expert filter chips — pick by equipment & target muscle (Fittr-style) */}
            {type === "workout" && (equipOptions.length > 0 || muscleOptions.length > 0) && (
              <div className="space-y-1.5 mb-2">
                {equipOptions.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    <span className="text-[10px] uppercase shrink-0 pr-0.5" style={{ color: "#5c6672", letterSpacing: "0.06em" }}>Equipment</span>
                    <FilterChip active={libEquip === null} onClick={() => setLibEquip(null)}>All</FilterChip>
                    {equipOptions.map((eq) => (
                      <FilterChip key={eq} active={libEquip === eq} onClick={() => setLibEquip(libEquip === eq ? null : eq)}>{eq}</FilterChip>
                    ))}
                  </div>
                )}
                {muscleOptions.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    <span className="text-[10px] uppercase shrink-0 pr-0.5" style={{ color: "#5c6672", letterSpacing: "0.06em" }}>Muscle</span>
                    <FilterChip active={libMuscle === null} onClick={() => setLibMuscle(null)}>All</FilterChip>
                    {muscleOptions.map((mg) => (
                      <FilterChip key={mg} active={libMuscle === mg} onClick={() => setLibMuscle(libMuscle === mg ? null : mg)}>{mg}</FilterChip>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Veg / non-veg filter for the food library */}
            {type === "meal" && (
              <div className="flex items-center gap-1.5 mb-2">
                <FilterChip active={libVeg === null} onClick={() => setLibVeg(null)}>All</FilterChip>
                <FilterChip active={libVeg === "veg"} onClick={() => setLibVeg(libVeg === "veg" ? null : "veg")}>Veg</FilterChip>
                <FilterChip active={libVeg === "nonveg"} onClick={() => setLibVeg(libVeg === "nonveg" ? null : "nonveg")}>Non-veg</FilterChip>
              </div>
            )}

            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px]" style={{ color: "#5c6672" }}>{libFiltered.length} shown</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {!libLoaded && <p className="text-xs p-2" style={{ color: "#7e8a9e" }}><Loader2 size={12} className="inline animate-spin mr-1" /> Loading…</p>}
              {libLoaded && libFiltered.length === 0 && (
                <p className="text-xs p-2" style={{ color: "#7e8a9e" }}>
                  {(libSearch || libEquip || libMuscle || libVeg)
                    ? "No matches — try clearing a filter."
                    : <>Nothing in the library yet — add items in <span style={{ color: "#2dd4bf" }}>Coach → Library</span> first.</>}
                </p>
              )}
              {libFiltered.map((x) => (
                <button key={x.id} onClick={() => (type === "workout" ? addExercise(x as Exercise) : addFood(x as Food))}
                  className="w-full flex items-center gap-2.5 text-left px-2 py-1.5 rounded-lg text-sm hover:bg-white/5" style={{ color: "#e8eaf0" }}>
                  {type === "workout" && (
                    <ExerciseDemo demo={(x as Exercise).demo_url} start={(x as Exercise).image_start} end={(x as Exercise).image_end} alt={x.name} size={34} rounded={8} />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{x.name}</span>
                    <span className="block text-[11px] truncate" style={{ color: "#7e8a9e" }}>
                      {type === "workout"
                        ? [(x as Exercise).muscle_group, (x as Exercise).equipment].filter(Boolean).join(" · ")
                        : `${(x as Food).portion} · ${(x as Food).calories ?? "—"} kcal`}
                    </span>
                  </span>
                  <Plus size={14} className="shrink-0" style={{ color: "#2dd4bf" }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Workout item rows */}
        {type === "workout" && workoutItems.map((it, i) => (
          <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
            <ExerciseDemo demo={it.demoUrl} start={it.imageStart} end={it.imageEnd} alt={it.name} size={36} rounded={9} />
            {/* Real weekday slot. Defaults to whatever the legacy freeform
                "day" text implied, so opening an old plan doesn't silently
                reset every exercise to unscheduled. */}
            <select
              value={inferDayOfWeek(it) ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value)
                setWorkoutItems((p) => p.map((x, idx) => idx === i ? { ...x, dayOfWeek: v === 0 ? null : v, day: v === 0 ? null : dayLabel(v) } : x))
              }}
              className="w-[74px] px-1.5 py-1.5 rounded-lg text-xs focus:outline-none shrink-0"
              style={inputStyle}
              aria-label="Day of week"
            >
              <option value={0}>Any day</option>
              {DAYS.map((d) => <option key={d.n} value={d.n}>{d.label}</option>)}
            </select>
            <span className="flex-1 text-sm truncate" style={{ color: "#e8eaf0" }}>
              {it.name}
              {it.videoUrl && <Video size={11} className="inline ml-1.5" style={{ color: "#2dd4bf" }} />}
            </span>
            <input type="number" value={it.sets ?? ""} onChange={(e) => setWorkoutItems((p) => p.map((x, idx) => idx === i ? { ...x, sets: e.target.value === "" ? null : Number(e.target.value) } : x))} placeholder="Sets" className="w-14 px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={inputStyle} />
            <input value={it.reps ?? ""} onChange={(e) => setWorkoutItems((p) => p.map((x, idx) => idx === i ? { ...x, reps: e.target.value } : x))} placeholder="Reps" className="w-16 px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={inputStyle} />
            <button onClick={() => setWorkoutItems((p) => p.filter((_, idx) => idx !== i))} style={{ color: "#fb7185" }} aria-label="Remove"><Trash2 size={14} /></button>
          </div>
        ))}

        {/* Meal item rows */}
        {type === "meal" && mealItems.map((it, i) => (
          <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
            <input value={it.meal || ""} onChange={(e) => setMealItems((p) => p.map((x, idx) => idx === i ? { ...x, meal: e.target.value } : x))} placeholder="Meal" className="w-24 px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={inputStyle} />
            <span className="flex-1 text-sm truncate" style={{ color: "#e8eaf0" }}>{it.name} <span className="text-[11px]" style={{ color: "#7e8a9e" }}>({it.portion})</span></span>
            <input type="number" step="0.5" min="0.5" value={it.qty ?? 1} onChange={(e) => setMealItems((p) => p.map((x, idx) => idx === i ? { ...x, qty: e.target.value === "" ? 1 : Number(e.target.value) } : x))} className="w-16 px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={inputStyle} aria-label="Quantity" />
            <span className="text-[11px] tabular-nums w-16 text-right" style={{ color: "#7e8a9e" }}>{Math.round((it.calories || 0) * (it.qty || 1))} kcal</span>
            <button onClick={() => setMealItems((p) => p.filter((_, idx) => idx !== i))} style={{ color: "#fb7185" }} aria-label="Remove"><Trash2 size={14} /></button>
          </div>
        ))}

        {/* Meal totals */}
        {type === "meal" && mealItems.length > 0 && (
          <div className="flex items-center justify-end gap-4 px-2 py-2 text-[12px] tabular-nums" style={{ color: "#2dd4bf" }}>
            <span>Total: {Math.round(totals.kcal)} kcal</span>
            <span>P {totals.p.toFixed(0)}g</span>
            <span>C {totals.c.toFixed(0)}g</span>
            <span>F {totals.f.toFixed(0)}g</span>
          </div>
        )}
      </div>

      {/* ── Free-text sections (unchanged behavior) ── */}
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={section.heading}
                onChange={(e) => updateSection(i, "heading", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none"
                style={inputStyle}
                placeholder={`Section heading (e.g. ${type === "meal" ? "Guidelines" : "Warm-up"})`}
              />
              {sections.length > 1 && (
                <button onClick={() => removeSection(i)} className="p-2 rounded-lg" style={{ color: "#fb7185" }} aria-label="Remove section">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <textarea
              value={section.body}
              onChange={(e) => updateSection(i, "body", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none"
              style={inputStyle}
              placeholder="Details..."
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <button onClick={addSection} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "#2dd4bf" }}>
          <Plus size={16} /> Add section
        </button>
        <button onClick={handleSaveTemplate} disabled={tplSaving} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "#7e8a9e" }}>
          {tplSaving ? <Loader2 size={14} className="animate-spin" /> : <BookmarkPlus size={15} />} Save as template
        </button>
      </div>

      {/* PDF attachment */}
      <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
        {filePath ? (
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(45, 212, 191, 0.1)" }}>
            <span className="inline-flex items-center gap-2 text-sm" style={{ color: "#2dd4bf" }}>
              <FileText size={16} /> PDF attached
            </span>
            <button onClick={() => setFilePath(null)} className="p-1 rounded" style={{ color: "#7e8a9e" }} aria-label="Remove PDF">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.05)", color: "#c9cdd5", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Uploading..." : "Attach PDF (optional)"}
          </button>
        )}
      </div>

      {error && <p className="text-xs mt-3" style={{ color: "#fb7185" }}>{error}</p>}

      <motion.button
        onClick={handleSave}
        disabled={saving}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full mt-5 h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14" }}
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <><Check size={18} /> Saved</> : "Save Plan"}
      </motion.button>
    </div>
  )
}
