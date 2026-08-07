"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, Loader2, Check, Plus, Trash2, ShieldCheck } from "lucide-react"
import { addLab } from "@/app/actions/health"
import { parseLabText, type ParsedLab } from "@/lib/labs/parse"

const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" } as const

interface Row extends ParsedLab { id: number }

/**
 * Free lab-report import: pick a PDF/photo → parsed on-device (pdf.js /
 * tesseract.js) → editable confirmation → saved. Never uploads the file
 * anywhere; only the values the client confirms reach the database.
 */
export function LabReportUpload({ clientId }: { clientId?: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<"pick" | "reading" | "review">("pick")
  const [status, setStatus] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const nextId = useRef(1)

  const reset = () => { setPhase("pick"); setRows([]); setErr(null); setStatus("") }

  const onFile = async (f: File | null) => {
    if (!f) return
    setPhase("reading"); setErr(null)
    try {
      const { extractReportText } = await import("@/lib/labs/extract")
      const text = await extractReportText(f, setStatus)
      const parsed = text ? parseLabText(text) : []
      setRows(parsed.map((p) => ({ ...p, id: nextId.current++ })))
      setPhase("review")
      if (!parsed.length) {
        setErr(text
          ? "We couldn't recognize test values automatically — add them below from your report."
          : "This file couldn't be read (scanned PDFs need a photo instead). Add the values below from your report.")
      }
    } catch {
      setRows([]); setPhase("review")
      setErr("Reading failed — you can still enter the values below.")
    }
  }

  const setRow = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const addRow = () => setRows((rs) => [...rs, { id: nextId.current++, key: null, name: "", value: NaN, unit: null, low: null, high: null }])
  const delRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id))

  const save = async () => {
    const clean = rows.filter((r) => r.name.trim() && Number.isFinite(r.value))
    if (!clean.length) { setErr("Add at least one test value."); return }
    setSaving(true); setErr(null)
    // Known tests also fill their trend columns; everything is kept in extras
    // (with ranges) for the gauge dashboard.
    const core: Record<string, number> = {}
    for (const r of clean) if (r.key && core[r.key] === undefined) core[r.key] = r.value
    const res = await addLab({
      clientId,
      taken_on: date,
      ...core,
      extras: clean.map(({ name, value, unit, low, high }) => ({ name, value, unit, low, high })),
      source: "upload",
    } as never)
    setSaving(false)
    if (!res.success) { setErr(res.error || "Could not save"); return }
    setOpen(false); reset()
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true) }}
        className="w-full flex items-center gap-3 p-4 rounded-2xl text-left"
        style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.14)" }}>
          <Upload size={19} style={{ color: "#2dd4bf" }} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: "#e8eaf0" }}>Upload blood report</p>
          <p className="text-[11.5px] mt-0.5" style={{ color: "#7e8a9e" }}>PDF or photo — values read on your phone, never uploaded</p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ background: "rgba(4,8,14,0.82)", backdropFilter: "blur(6px)" }} onClick={() => !saving && setOpen(false)}>
          <div
            className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 tw-fade-up"
            style={{ background: "#0d111b", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>
                {phase === "review" ? "Confirm your values" : "Upload blood report"}
              </h3>
              <button onClick={() => !saving && setOpen(false)} style={{ color: "#7e8a9e" }} aria-label="Close"><X size={18} /></button>
            </div>

            {phase === "pick" && (
              <div>
                <p className="text-sm mt-2" style={{ color: "#a9b2c1", lineHeight: 1.5 }}>
                  Choose the PDF your lab emailed you (best), or a clear photo of the report.
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full mt-5 rounded-2xl py-10 flex flex-col items-center gap-3"
                  style={{ border: "1.5px dashed rgba(45,212,191,0.35)", background: "rgba(45,212,191,0.04)" }}
                >
                  <Upload size={26} style={{ color: "#2dd4bf" }} />
                  <span className="text-sm font-semibold" style={{ color: "#2dd4bf" }}>Choose file</span>
                  <span className="text-[11px]" style={{ color: "#7e8a9e" }}>PDF · JPG · PNG</span>
                </button>
                <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
                <div className="flex items-start gap-2 mt-4">
                  <ShieldCheck size={14} style={{ color: "#34d399", marginTop: 2 }} />
                  <p className="text-[11.5px]" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>
                    Reading happens entirely on your device. The file itself is never uploaded — only the values you confirm are saved.
                  </p>
                </div>
              </div>
            )}

            {phase === "reading" && (
              <div className="py-14 flex flex-col items-center gap-4">
                <Loader2 size={28} className="animate-spin" style={{ color: "#2dd4bf" }} />
                <p className="text-sm" style={{ color: "#a9b2c1" }}>{status || "Reading…"}</p>
              </div>
            )}

            {phase === "review" && (
              <div className="mt-3">
                {rows.length > 0 && (
                  <p className="text-[12.5px] mb-3" style={{ color: "#a9b2c1" }}>
                    We read {rows.length} value{rows.length === 1 ? "" : "s"} from your report — check them against the paper before saving.
                  </p>
                )}
                <label className="block text-[11px] uppercase mb-1" style={{ color: "#7e8a9e", letterSpacing: "0.06em" }}>Report date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm mb-4" style={inputStyle} />

                <div className="space-y-2.5">
                  {rows.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2">
                        <input value={r.name} onChange={(e) => setRow(r.id, { name: e.target.value })} placeholder="Test name" className="flex-1 px-2.5 py-1.5 rounded-lg text-sm font-medium" style={inputStyle} />
                        <input value={Number.isFinite(r.value) ? r.value : ""} onChange={(e) => setRow(r.id, { value: Number(e.target.value) })} inputMode="decimal" placeholder="Value" className="w-20 px-2.5 py-1.5 rounded-lg text-sm text-right tabular-nums" style={inputStyle} />
                        <button onClick={() => delRow(r.id)} style={{ color: "#5a6578" }} aria-label="Remove"><Trash2 size={14} /></button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input value={r.unit ?? ""} onChange={(e) => setRow(r.id, { unit: e.target.value })} placeholder="Unit" className="w-24 px-2.5 py-1.5 rounded-lg text-[12px]" style={inputStyle} />
                        <span className="text-[11px]" style={{ color: "#5a6578" }}>Normal:</span>
                        <input value={r.low ?? ""} onChange={(e) => setRow(r.id, { low: e.target.value === "" ? null : Number(e.target.value) })} inputMode="decimal" placeholder="low" className="w-16 px-2 py-1.5 rounded-lg text-[12px] text-right tabular-nums" style={inputStyle} />
                        <span style={{ color: "#5a6578" }}>–</span>
                        <input value={r.high ?? ""} onChange={(e) => setRow(r.id, { high: e.target.value === "" ? null : Number(e.target.value) })} inputMode="decimal" placeholder="high" className="w-16 px-2 py-1.5 rounded-lg text-[12px] text-right tabular-nums" style={inputStyle} />
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={addRow} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: "#2dd4bf" }}>
                  <Plus size={14} /> Add another test
                </button>

                {err && <p className="text-xs mt-3" style={{ color: "#fb7185" }}>{err}</p>}

                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full mt-5 h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2"
                  style={{ background: "#2dd4bf", color: "#06231f", boxShadow: "0 8px 24px rgba(45,212,191,0.25)" }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save to my labs
                </button>
                <p className="text-[10.5px] text-center mt-3" style={{ color: "#5a6578" }}>
                  For tracking only — always discuss results with your doctor.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
