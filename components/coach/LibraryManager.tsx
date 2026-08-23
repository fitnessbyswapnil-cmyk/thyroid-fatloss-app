"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Dumbbell, Apple, Plus, Pencil, Trash2, Loader2, Search, X, Video, Leaf, Drumstick, Upload, FlaskConical } from "lucide-react"
import { RecipeComposer } from "@/components/coach/RecipeComposer"
import {
  type Exercise, type Food,
  upsertExercise, deleteExercise, upsertFood, deleteFood,
  importExercises, importFoods,
} from "@/app/actions/library"
import { ExerciseDemo } from "@/components/dashboard/ExerciseDemo"

/**
 * Small CSV parser: handles quoted fields + commas inside quotes. First row is
 * the header; returns array of objects keyed by lowercased header names.
 */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let cur = "", row: string[] = [], inQ = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQ = false
      else cur += ch
    } else if (ch === '"') inQ = true
    else if (ch === ",") { row.push(cur); cur = "" }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cur); cur = ""
      if (row.some((c) => c.trim() !== "")) rows.push(row)
      row = []
    } else cur += ch
  }
  row.push(cur)
  if (row.some((c) => c.trim() !== "")) rows.push(row)
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])))
}

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" } as const

export function LibraryManager({ initialExercises, initialFoods }: { initialExercises: Exercise[]; initialFoods: Food[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<"workouts" | "foods">("workouts")
  const [search, setSearch] = useState("")
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const handleCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setImporting(true); setImportMsg(null)
    try {
      const rows = parseCsv(await file.text())
      if (!rows.length) throw new Error("CSV needs a header row + at least one data row")
      const res = tab === "workouts"
        ? await importExercises(rows as never)
        : await importFoods(rows as never)
      if (!res.success) throw new Error(res.error || "Import failed")
      setImportMsg(`Imported ${(res as { count?: number }).count ?? rows.length} ${tab === "workouts" ? "exercises" : "foods"} ✓`)
      router.refresh()
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0e131c" }}>
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: "rgba(9,12,20,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/coach" className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>Library</h1>
          <div className="flex items-center gap-2 ml-4">
            {(["workouts", "foods"] as const).map((t) => {
              const count = t === "workouts" ? initialExercises.length : initialFoods.length
              return (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-2 rounded-full text-sm font-medium capitalize inline-flex items-center gap-2"
                  style={{
                    background: tab === t ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${tab === t ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.06)"}`,
                    color: tab === t ? "#2dd4bf" : "#7e8a9e",
                  }}>
                  {t === "workouts" ? <Dumbbell size={15} /> : <Apple size={15} />} {t}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: tab === t ? "rgba(45,212,191,0.2)" : "rgba(255,255,255,0.07)" }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Search + CSV import */}
        <div className="flex items-center gap-3 mb-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#7e8a9e" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "workouts" ? "Search exercises…" : "Search foods…"}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", color: "#c9cdd5", border: "1px solid rgba(255,255,255,0.08)" }}>
            {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Import CSV
            <input type="file" accept=".csv,text/csv" onChange={handleCsv} className="hidden" disabled={importing} />
          </label>
        </div>
        <p className="text-[11px] mb-5" style={{ color: importMsg?.endsWith("✓") ? "#2dd4bf" : importMsg ? "#fb7185" : "#5a6578" }}>
          {importMsg || (tab === "workouts"
            ? "CSV headers: name, muscle_group, equipment, video_url, cues — starter file: data/exercises-starter.csv"
            : "CSV headers: name, portion, calories, protein, carbs, fats, is_veg, tags — starter file: data/foods-starter.csv")}
        </p>

        {tab === "workouts"
          ? <ExerciseList items={initialExercises} search={search} onChanged={() => router.refresh()} />
          : <FoodList items={initialFoods} search={search} onChanged={() => router.refresh()} />}
      </main>
    </div>
  )
}

/* ─────────────────────────── exercises ─────────────────────────── */

function ExerciseList({ items, search, onChanged }: { items: Exercise[]; search: string; onChanged: () => void }) {
  const [editing, setEditing] = useState<Partial<Exercise> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = items.filter((e) =>
    !search || `${e.name} ${e.muscle_group || ""} ${e.equipment || ""}`.toLowerCase().includes(search.toLowerCase()))

  const save = async () => {
    if (!editing?.name?.trim()) { setError("Name is required"); return }
    setBusy(true); setError(null)
    const res = await upsertExercise(editing as Exercise & { name: string })
    setBusy(false)
    if (!res.success) { setError(res.error || "Failed"); return }
    setEditing(null); onChanged()
  }
  const remove = async (id: string) => {
    setBusy(true)
    const res = await deleteExercise(id)
    setBusy(false)
    if (res.success) onChanged()
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14" }}>
        <Plus size={16} /> Add exercise
      </button>

      {editing && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl space-y-3" style={card}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>{editing.id ? "Edit exercise" : "New exercise"}</h3>
            <button onClick={() => setEditing(null)} style={{ color: "#7e8a9e" }} aria-label="Close"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="Name *" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
            <input placeholder="Muscle group (e.g. Legs)" value={editing.muscle_group || ""} onChange={(e) => setEditing({ ...editing, muscle_group: e.target.value })} className="px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
            <input placeholder="Equipment (e.g. None)" value={editing.equipment || ""} onChange={(e) => setEditing({ ...editing, equipment: e.target.value })} className="px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
          </div>
          <input placeholder="Video URL (YouTube etc., optional)" value={editing.video_url || ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
          <textarea placeholder="Coaching cues (optional)" rows={2} value={editing.cues || ""} onChange={(e) => setEditing({ ...editing, cues: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none" style={inputStyle} />
          {error && <p className="text-xs" style={{ color: "#fb7185" }}>{error}</p>}
          <button onClick={save} disabled={busy} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14" }}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : null} Save
          </button>
        </motion.div>
      )}

      {filtered.length === 0 && !editing && (
        <div className="p-10 rounded-2xl text-center" style={card}>
          <Dumbbell size={28} className="mx-auto mb-3" style={{ color: "#404858" }} />
          <p className="text-sm" style={{ color: "#7e8a9e" }}>{items.length === 0 ? "No exercises yet — add your first." : "No matches."}</p>
        </div>
      )}

      {filtered.map((e) => (
        <div key={e.id} className="p-4 rounded-2xl flex items-start gap-3" style={card}>
          <ExerciseDemo demo={e.demo_url} start={e.image_start} end={e.image_end} alt={e.name} size={56} rounded={12} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>{e.name}</span>
              {e.muscle_group && <span className="px-2 py-0.5 rounded text-[10px] uppercase" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}>{e.muscle_group}</span>}
              {e.equipment && <span className="px-2 py-0.5 rounded text-[10px] uppercase" style={{ background: "rgba(255,255,255,0.06)", color: "#7e8a9e" }}>{e.equipment}</span>}
              {e.video_url && (
                <a href={e.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#2dd4bf" }}>
                  <Video size={12} /> video
                </a>
              )}
            </div>
            {e.cues && <p className="text-xs mt-1" style={{ color: "#7e8a9e" }}>{e.cues}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditing(e)} className="p-2 rounded-lg" style={{ color: "#7e8a9e" }} aria-label="Edit"><Pencil size={15} /></button>
            <button onClick={() => remove(e.id)} className="p-2 rounded-lg" style={{ color: "#fb7185" }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────── foods ─────────────────────────── */

function FoodList({ items, search, onChanged }: { items: Food[]; search: string; onChanged: () => void }) {
  const [editing, setEditing] = useState<Partial<Food> | null>(null)
  const [composing, setComposing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = items.filter((f) =>
    !search || `${f.name} ${f.tags || ""}`.toLowerCase().includes(search.toLowerCase()))

  const save = async () => {
    if (!editing?.name?.trim()) { setError("Name is required"); return }
    setBusy(true); setError(null)
    const res = await upsertFood({ ...editing, name: editing.name!, portion: editing.portion || "1 serving" })
    setBusy(false)
    if (!res.success) { setError(res.error || "Failed"); return }
    setEditing(null); onChanged()
  }
  const remove = async (id: string) => {
    setBusy(true)
    const res = await deleteFood(id)
    setBusy(false)
    if (res.success) onChanged()
  }

  const numInput = (key: "calories" | "protein" | "carbs" | "fats", ph: string) => (
    <input placeholder={ph} type="number" value={(editing?.[key] as number | null) ?? ""}
      onChange={(e) => setEditing({ ...editing!, [key]: e.target.value === "" ? null : Number(e.target.value) })}
      className="px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setEditing({ is_veg: true })} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14" }}>
          <Plus size={16} /> Add food
        </button>
        {/* Compose from measured ingredients instead of typing macros by hand. */}
        <button onClick={() => setComposing(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.28)" }}>
          <FlaskConical size={16} /> Build from ingredients
        </button>
      </div>
      {composing && <RecipeComposer onClose={() => setComposing(false)} />}

      {editing && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl space-y-3" style={card}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>{editing.id ? "Edit food" : "New food"}</h3>
            <button onClick={() => setEditing(null)} style={{ color: "#7e8a9e" }} aria-label="Close"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Name * (e.g. Moong dal chilla)" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
            <input placeholder="Portion (e.g. 2 pieces / 1 katori)" value={editing.portion || ""} onChange={(e) => setEditing({ ...editing, portion: e.target.value })} className="px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {numInput("calories", "kcal")}
            {numInput("protein", "Protein g")}
            {numInput("carbs", "Carbs g")}
            {numInput("fats", "Fats g")}
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#c9cdd5" }}>
              <input type="checkbox" checked={editing.is_veg ?? true} onChange={(e) => setEditing({ ...editing, is_veg: e.target.checked })} style={{ accentColor: "#2dd4bf" }} />
              Vegetarian
            </label>
            <input placeholder="Tags (breakfast, high-protein…)" value={editing.tags || ""} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} className="flex-1 px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
          </div>
          {error && <p className="text-xs" style={{ color: "#fb7185" }}>{error}</p>}
          <button onClick={save} disabled={busy} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14" }}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : null} Save
          </button>
        </motion.div>
      )}

      {filtered.length === 0 && !editing && (
        <div className="p-10 rounded-2xl text-center" style={card}>
          <Apple size={28} className="mx-auto mb-3" style={{ color: "#404858" }} />
          <p className="text-sm" style={{ color: "#7e8a9e" }}>{items.length === 0 ? "No foods yet — add your first." : "No matches."}</p>
        </div>
      )}

      {filtered.map((f) => (
        <div key={f.id} className="p-4 rounded-2xl flex items-start justify-between gap-4" style={card}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {f.is_veg ? <Leaf size={13} style={{ color: "#34d399" }} /> : <Drumstick size={13} style={{ color: "#fb7185" }} />}
              <span className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>{f.name}</span>
              <span className="text-[11px]" style={{ color: "#7e8a9e" }}>· {f.portion}</span>
            </div>
            <p className="text-xs mt-1 tabular-nums" style={{ color: "#7e8a9e" }}>
              {f.calories != null ? `${f.calories} kcal` : "kcal —"}
              {" · P "}{f.protein ?? "—"}{"g · C "}{f.carbs ?? "—"}{"g · F "}{f.fats ?? "—"}g
              {f.tags ? <span style={{ color: "#5a6578" }}> · {f.tags}</span> : null}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditing(f)} className="p-2 rounded-lg" style={{ color: "#7e8a9e" }} aria-label="Edit"><Pencil size={15} /></button>
            <button onClick={() => remove(f.id)} className="p-2 rounded-lg" style={{ color: "#fb7185" }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}
