"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Apple, Dumbbell, Plus, Trash2, FileText, Loader2, Check, Upload, X } from "lucide-react"
import { savePlan, type Plan, type PlanType, type PlanSection } from "@/app/actions/plans"

const META: Record<PlanType, { label: string; icon: typeof Apple; tint: string }> = {
  meal: { label: "Meal Plan", icon: Apple, tint: "#2dd4bf" },
  workout: { label: "Workout Plan", icon: Dumbbell, tint: "#34d399" },
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
  const [filePath, setFilePath] = useState<string | null>(plan?.file_path ?? null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateSection = (i: number, field: keyof PlanSection, value: string) =>
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  const addSection = () => setSections((prev) => [...prev, { heading: "", body: "" }])
  const removeSection = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i))

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed")
      return
    }
    setError(null)
    setUploading(true)
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
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const result = await savePlan({ clientId, type, title, sections, filePath })
    setSaving(false)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } else {
      setError(result.error || "Failed to save")
    }
  }

  const inputStyle = {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#e8eaf0",
  } as const

  return (
    <div
      className="p-6 rounded-2xl"
      style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(45, 212, 191, 0.12)" }}>
          <Icon size={18} style={{ color: meta.tint }} />
        </div>
        <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>{meta.label}</h3>
      </div>

      <label className="block text-xs uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-5"
        style={inputStyle}
        placeholder={meta.label}
      />

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={section.heading}
                onChange={(e) => updateSection(i, "heading", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none"
                style={inputStyle}
                placeholder={`Section heading (e.g. ${type === "meal" ? "Breakfast" : "Warm-up"})`}
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

      <button onClick={addSection} className="inline-flex items-center gap-2 mt-3 text-sm font-medium" style={{ color: "#2dd4bf" }}>
        <Plus size={16} /> Add section
      </button>

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
