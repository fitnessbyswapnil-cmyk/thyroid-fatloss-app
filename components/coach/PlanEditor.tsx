"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Apple, Dumbbell, Plus, Trash2, FileText, Loader2, Check, Upload, X,
  Search, BookmarkPlus, FolderOpen, Video,
} from "lucide-react"
import { savePlan, type Plan, type PlanType, type PlanSection, type WorkoutItem, type MealItem } from "@/app/actions/plans"
import { listExercises, listFoods, type Exercise, type Food } from "@/app/actions/library"
import { listTemplates, saveTemplate, deleteTemplate, type PlanTemplate } from "@/app/actions/templates"

const META: Record<PlanType, { label: string; icon: typeof Apple; tint: string }> = {
  meal: { label: "Meal Plan", icon: Apple, tint: "#2dd4bf" },
  workout: { label: "Workout Plan", icon: Dumbbell, tint: "#34d399" },
}

const inputStyle = {
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  color: "#e8eaf0",
} as const

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

  // Templates
  const [templates, setTemplates] = useState<PlanTemplate[] | null>(null)
  const [tplOpen, setTplOpen] = useState(false)
  const [tplSaving, setTplSaving] = useState(false)

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
      videoUrl: e.video_url, notes: e.cues || null,
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
  const libFiltered = (lib as Array<Exercise | Food>).filter(
    (x) => !libSearch || x.name.toLowerCase().includes(libSearch.toLowerCase())
  )

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
          <button onClick={openPicker} className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#2dd4bf" }}>
            <Plus size={14} /> Add from library
          </button>
        </div>

        {pickerOpen && (
          <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(45,212,191,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Search size={14} style={{ color: "#7e8a9e" }} />
              <input autoFocus value={libSearch} onChange={(e) => setLibSearch(e.target.value)} placeholder="Search library…" className="flex-1 px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
              <button onClick={() => setPickerOpen(false)} style={{ color: "#7e8a9e" }} aria-label="Close picker"><X size={14} /></button>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1">
              {!libLoaded && <p className="text-xs p-2" style={{ color: "#7e8a9e" }}><Loader2 size={12} className="inline animate-spin mr-1" /> Loading…</p>}
              {libLoaded && libFiltered.length === 0 && (
                <p className="text-xs p-2" style={{ color: "#7e8a9e" }}>
                  Nothing in the library yet — add items in <span style={{ color: "#2dd4bf" }}>Coach → Library</span> first.
                </p>
              )}
              {libFiltered.map((x) => (
                <button key={x.id} onClick={() => (type === "workout" ? addExercise(x as Exercise) : addFood(x as Food))}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5" style={{ color: "#e8eaf0" }}>
                  {x.name}
                  <span className="text-[11px] ml-2" style={{ color: "#7e8a9e" }}>
                    {type === "workout" ? (x as Exercise).muscle_group || "" : `${(x as Food).portion} · ${(x as Food).calories ?? "—"} kcal`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Workout item rows */}
        {type === "workout" && workoutItems.map((it, i) => (
          <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
            <input value={it.day || ""} onChange={(e) => setWorkoutItems((p) => p.map((x, idx) => idx === i ? { ...x, day: e.target.value } : x))} placeholder="Day" className="w-16 px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={inputStyle} />
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
