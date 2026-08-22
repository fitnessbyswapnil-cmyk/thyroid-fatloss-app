"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Activity, Pill, FlaskConical, Plus, Trash2, Loader2, Check } from "lucide-react"
import { saveHealthProfile, addLab, deleteLab, type HealthProfile, type LabResult } from "@/app/actions/health"
import { TrendChart, type TrendPoint } from "@/components/charts/TrendChart"
import { LabReportUpload } from "@/components/health/LabReportUpload"
import { LabGauges } from "@/components/health/LabGauges"
import { LabDeltas } from "@/components/health/LabDeltas"

const card = { background: "#FDFBF7", border: "1px solid #e2dbcd" } as const
const inputStyle = { background: "#FDFBF7", border: "1px solid #e2dbcd", color: "#1c1d20" } as const

interface MetricDef {
  key: string
  label: string
  unit: string
  get: (l: LabResult) => number | null
}

/** Markers that already have a dedicated column, so they aren't duplicated from extras. */
function isCoreCovered(name: string) {
  const s = name.toLowerCase()
  return /tsh|free ?t3|free ?t4|^t3\b|^t4\b|total t3|total t4|vitamin d|25[- ]oh|b-?12|cobalamin|ferritin/.test(s)
}

/**
 * Chartable markers = the core columns + any marker that appears in at least
 * two uploaded reports. The two-report floor matters: a single data point is a
 * dot, not a trend, and offering it as a "chart" is misleading.
 */
function buildMetrics(labs: LabResult[]): MetricDef[] {
  const seen = new Map<string, { unit: string | null; n: number }>()
  for (const l of labs) {
    for (const e of l.extras || []) {
      if (isCoreCovered(e.name)) continue
      const cur = seen.get(e.name) || { unit: e.unit, n: 0 }
      cur.n += 1
      seen.set(e.name, cur)
    }
  }
  const extras: MetricDef[] = [...seen.entries()]
    .filter(([, v]) => v.n >= 2)
    .map(([name, v]) => ({
      key: `x:${name}`,
      label: name.length > 14 ? name.slice(0, 13) + "…" : name,
      unit: v.unit || "",
      get: (l: LabResult) => l.extras?.find((e) => e.name === name)?.value ?? null }))
  return [...CORE_METRICS, ...extras]
}

const CORE_METRICS: MetricDef[] = [
  { key: "tsh", label: "TSH", unit: "", get: (l) => l.tsh },
  { key: "t3", label: "T3", unit: "", get: (l) => l.t3 },
  { key: "t4", label: "T4", unit: "", get: (l) => l.t4 },
  { key: "vitamin_d", label: "Vit D", unit: "", get: (l) => l.vitamin_d },
  { key: "b12", label: "B12", unit: "", get: (l) => l.b12 },
  { key: "ferritin", label: "Ferritin", unit: "", get: (l) => l.ferritin },
  { key: "weight_kg", label: "Weight", unit: "kg", get: (l) => l.weight_kg },
]

export function HealthView({
  profile,
  labs,
  clientId,
  clientName,
  asCoach = false }: {
  profile: HealthProfile | null
  labs: LabResult[]
  clientId?: string
  clientName?: string
  asCoach?: boolean
}) {
  const router = useRouter()
  const [p, setP] = useState<Partial<HealthProfile>>(profile || {})
  const [savingP, setSavingP] = useState(false)
  const [savedP, setSavedP] = useState(false)
  const [metric, setMetric] = useState<string>("tsh")
  const [adding, setAdding] = useState(false)
  const [lab, setLab] = useState<Record<string, string>>({ taken_on: new Date().toISOString().slice(0, 10) })
  const [err, setErr] = useState<string | null>(null)

  const set = (k: keyof HealthProfile, v: string) => setP((prev) => ({ ...prev, [k]: v }))

  const saveProfile = async () => {
    setSavingP(true); setErr(null)
    const res = await saveHealthProfile({ ...p, clientId })
    setSavingP(false)
    if (!res.success) { setErr(res.error || "Save failed"); return }
    setSavedP(true); setTimeout(() => setSavedP(false), 1800)
    router.refresh()
  }

  const submitLab = async () => {
    setAdding(true); setErr(null)
    const res = await addLab({ ...(lab as any), clientId, taken_on: lab.taken_on })
    setAdding(false)
    if (!res.success) { setErr(res.error || "Could not add"); return }
    setLab({ taken_on: new Date().toISOString().slice(0, 10) })
    router.refresh()
  }

  const removeLab = async (id: string) => {
    await deleteLab(id, clientId)
    router.refresh()
  }

  const METRICS = buildMetrics(labs)
  const meta = METRICS.find((m) => m.key === metric) ?? METRICS[0]
  // Accessor-based so a marker can come from a dedicated column OR the
  // extracted extras panel, without the chart needing to know which.
  const points: TrendPoint[] = labs
    .map((l) => ({ l, v: meta?.get(l) ?? null }))
    .filter((x): x is { l: LabResult; v: number } => typeof x.v === "number")
    .map(({ l, v }) => ({
      label: new Date(l.taken_on).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      value: v }))

  return (
    <div className="min-h-screen relative" style={{ background: "#F4F0E8", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}>
      <div className="tw-glow" style={{ position: "fixed", top: -150, left: 10, width: 360, height: 300, zIndex: 0 }} />
      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(253, 251, 247, 0.85)",  borderBottom: "1px solid #e2dbcd" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={asCoach && clientId ? `/coach/client/${clientId}` : "/dashboard"} className="p-2 -ml-2 rounded-lg" style={{ color: "#8b867c" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Newsreader', Georgia, serif",  color: "#1c1d20" }}>
            {asCoach ? `${clientName || "Client"} · Health` : "My Health"}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5 relative" style={{ zIndex: 1 }}>
        {/* Free on-device report import */}
        <LabReportUpload clientId={clientId} />

        {/* Latest report as range gauges */}
        {/* "What changed" sits above the gauges: on a repeat report, the first
            question is what moved, not what the absolute numbers are. */}
        <LabDeltas labs={labs} />

        {labs.length > 0 && <LabGauges lab={labs[labs.length - 1]} />}

        {/* Thyroid intake */}
        <div className="p-6 rounded-2xl" style={card}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#1c1d20" }}>
            <Pill size={16} style={{ color: "#155e56" }} /> Thyroid profile
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Diagnosis"><select value={p.diagnosis || ""} onChange={(e) => set("diagnosis", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
              <option value="">Select…</option>
              {["Hypothyroid", "Hashimoto's", "Subclinical", "Hyperthyroid", "Other", "None"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select></Field>
            <Field label="Diagnosed (year)"><input value={p.diagnosis_year || ""} onChange={(e) => set("diagnosis_year", e.target.value)} inputMode="numeric" placeholder="2021" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></Field>
            <Field label="Medication"><input value={p.medication || ""} onChange={(e) => set("medication", e.target.value)} placeholder="Levothyroxine" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></Field>
            <Field label="Dose"><input value={p.medication_dose || ""} onChange={(e) => set("medication_dose", e.target.value)} placeholder="50 mcg" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></Field>
            <Field label="When taken" full><input value={p.medication_timing || ""} onChange={(e) => set("medication_timing", e.target.value)} placeholder="Empty stomach, 30 min before breakfast" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></Field>
            <Field label="Menopause status"><select value={p.menopause_status || ""} onChange={(e) => set("menopause_status", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
              <option value="">Select…</option>
              {["Pre", "Peri", "Post", "N/A"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select></Field>
            <Field label="Other conditions"><input value={p.conditions || ""} onChange={(e) => set("conditions", e.target.value)} placeholder="PCOS, diabetes…" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></Field>
            <Field label="Allergies" full><input value={p.allergies || ""} onChange={(e) => set("allergies", e.target.value)} placeholder="None / list them" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></Field>
          </div>
          <button onClick={saveProfile} disabled={savingP} className="mt-4 h-11 px-5 rounded-xl font-medium inline-flex items-center gap-2" style={{ background: "#155e56", color: "#F6F3ED" }}>
            {savingP ? <Loader2 size={16} className="animate-spin" /> : savedP ? <Check size={16} /> : null}
            {savedP ? "Saved" : "Save profile"}
          </button>
        </div>

        {/* Lab trend */}
        <div className="p-6 rounded-2xl" style={card}>
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#1c1d20" }}>
            <Activity size={16} style={{ color: "#155e56" }} /> Trends
          </h3>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-3 pb-0.5">
            {METRICS.map((m) => (
              <button key={m.key} onClick={() => setMetric(m.key)} className="shrink-0 text-[12px] font-medium px-3 py-1 rounded-full whitespace-nowrap"
                style={metric === m.key ? { background: "#155e56", color: "#F6F3ED" } : { background: "#F1EDE1", color: "#3c3a34" }}>
                {m.label}
              </button>
            ))}
          </div>
          <TrendChart
            points={points}
            unit={meta.unit}
            goalDirection={metric === "weight_kg" || metric === "tsh" ? "down" : undefined}
            band={metric === "tsh" ? { min: 0.4, max: 4.0, label: "target ≤ 4.0" } : undefined}
          />
          {metric === "tsh" && (
            <p className="text-[11px] mt-2" style={{ color: "#a09a8e" }}>Shaded band = typical target range, 0.4–4.0 mIU/L. Your doctor's target may differ.</p>
          )}
        </div>

        {/* Labs history + add */}
        <div className="p-6 rounded-2xl" style={card}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#1c1d20" }}>
            <FlaskConical size={16} style={{ color: "#155e56" }} /> Lab results
          </h3>

          {/* add row */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Field label="Date"><input type="date" value={lab.taken_on || ""} onChange={(e) => setLab({ ...lab, taken_on: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></Field>
            <Field label="Weight (kg)"><input value={lab.weight_kg || ""} onChange={(e) => setLab({ ...lab, weight_kg: e.target.value })} inputMode="decimal" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></Field>
            {["tsh", "t3", "t4", "vitamin_d", "b12", "ferritin"].map((k) => (
              <Field key={k} label={CORE_METRICS.find((m) => m.key === k)?.label ?? k}>
                <input value={lab[k] || ""} onChange={(e) => setLab({ ...lab, [k]: e.target.value })} inputMode="decimal" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </Field>
            ))}
          </div>
          <button onClick={submitLab} disabled={adding} className="h-10 px-4 rounded-xl font-medium inline-flex items-center gap-2 mb-4" style={{ background: "rgba(21, 94, 86,0.12)", color: "#155e56" }}>
            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add lab result
          </button>

          {err && <p className="text-xs mb-3" style={{ color: "#A32B23" }}>{err}</p>}

          {labs.length === 0 ? (
            <p className="text-sm" style={{ color: "#8b867c" }}>No labs recorded yet. Add your latest report above.</p>
          ) : (
            <div className="space-y-1.5">
              {[...labs].reverse().map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl text-sm" style={{ background: "#FDFBF7" }}>
                  <span className="w-16 shrink-0 tabular-nums" style={{ color: "#1c1d20" }}>{new Date(l.taken_on).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span>
                  <span className="flex-1 text-xs tabular-nums" style={{ color: "#5a564e" }}>
                    {l.tsh != null && `TSH ${l.tsh}  `}{l.t4 != null && `T4 ${l.t4}  `}{l.vitamin_d != null && `D ${l.vitamin_d}  `}{l.ferritin != null && `Fer ${l.ferritin}  `}{l.weight_kg != null && `${l.weight_kg}kg`}
                  </span>
                  <button onClick={() => removeLab(l.id)} style={{ color: "#a09a8e" }} aria-label="Delete"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs px-1" style={{ color: "#a09a8e" }}>
          ThyroWell is coaching, not medical care. Always follow your doctor for medication and lab interpretation.
        </p>
      </main>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-[11px] uppercase mb-1" style={{ color: "#8b867c", letterSpacing: "0.06em" }}>{label}</label>
      {children}
    </div>
  )
}
