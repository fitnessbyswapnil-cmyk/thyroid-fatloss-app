"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TrendChart, type TrendPoint } from "@/components/charts/TrendChart"
import { parseSymptoms, symptomBurden, symptomChanges } from "@/lib/health/symptoms"
import { type Measurements } from "@/lib/health/measurements"
import { BodyCompositionChart, MetricBar } from "@/components/charts/BodyCompositionChart"

export interface CheckinPoint {
  week_number: number
  weight: number | null
  waist: number | null
  hips: number | null
  neck: number | null
  chest: number | null
  arm: number | null
  thigh: number | null
  calf: number | null
  energy_level: number | null
  /** The check-in writes sleep_quality; sleep_score is a dead column kept for legacy rows. */
  sleep_quality: number | null
  sleep_score: number | null
  mood: number | null
  digestion_score: number | null
  adherence_score: number | null
  steps: number | null
  symptoms?: unknown
}

/**
 * Three views, not fourteen chips.
 *
 * The seven body sites share centimetres and the useful question about them is
 * comparative — where is it coming off — so they belong on one chart together.
 * Weight is kilograms and is the headline, so it keeps its own trend. The
 * subjective scores share a 1-10 feel and answer a third question entirely.
 * Putting all three groups on one axis would compare nothing.
 */
type ViewKey = "weight" | "body" | "wellbeing"

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "weight", label: "Weight" },
  { key: "body", label: "Body" },
  { key: "wellbeing", label: "How you feel" },
]

/** Scored out of their own maximum, so a bar length means the same thing across rows. */
const WELLBEING: { key: keyof CheckinPoint; label: string; max: number; suffix: string }[] = [
  { key: "energy_level", label: "Energy", max: 10, suffix: "/10" },
  { key: "sleep_quality", label: "Sleep", max: 10, suffix: "/10" },
  { key: "mood", label: "Mood", max: 10, suffix: "/10" },
  { key: "digestion_score", label: "Digestion", max: 10, suffix: "/10" },
  { key: "adherence_score", label: "Nutrition", max: 100, suffix: "%" },
]

export function ProgressView({ checkins, backHref = "/dashboard" }: { checkins: CheckinPoint[]; backHref?: string }) {
  const [view, setView] = useState<ViewKey>("weight")

  // sleep_quality is what the check-in writes; sleep_score was never populated.
  // Coalesce so any legacy row still charts instead of silently vanishing.
  const sorted = [...checkins]
    .map((c) => ({ ...c, sleep_quality: c.sleep_quality ?? c.sleep_score }))
    .sort((a, b) => a.week_number - b.week_number)
  const points: TrendPoint[] = sorted
    .filter((c) => c.weight != null)
    .map((c) => ({ label: `W${c.week_number}`, value: Number(c.weight) }))

  const weightPts = sorted.filter((c) => c.weight != null)
  const startW = weightPts[0]?.weight ?? null
  const nowW = weightPts[weightPts.length - 1]?.weight ?? null
  const lost = startW != null && nowW != null ? +(startW - nowW).toFixed(1) : null

  return (
    <div className="min-h-screen relative" style={{ background: "#F4F0E8", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}>
      <div className="tw-glow" style={{ position: "fixed", top: -140, left: 30, width: 340, height: 300, zIndex: 0 }} />
      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(253, 251, 247, 0.85)",  borderBottom: "1px solid #e2dbcd" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={backHref} className="p-2 -ml-2 rounded-lg" style={{ color: "#8b867c" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Newsreader', Georgia, serif",  color: "#1c1d20" }}>My Progress</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5 relative" style={{ zIndex: 1 }}>
        {/* Glowing headline moment (prototype style) */}
        {lost != null && (
          <div className="text-center py-4">
            <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>
              Over {weightPts.length} check-ins
            </p>
            <p className="mt-2" style={{ fontFamily: "'Newsreader', Georgia, serif",  fontSize: 48, lineHeight: 1.05, color: "#1c1d20", textShadow: "0 0 44px rgba(21, 94, 86,0.35)" }}>
              {lost > 0 ? `${lost} kg down` : lost < 0 ? `${Math.abs(lost)} kg up` : "Holding steady"}
            </p>
            <p className="text-sm mt-2 mx-auto" style={{ color: "#5a564e", maxWidth: 300, lineHeight: 1.5 }}>
              {lost > 0
                ? "Slow is exactly right on thyroid — this pace protects your energy."
                : "Weight isn't the whole story on thyroid — watch your energy, sleep and mood too."}
            </p>
          </div>
        )}

        <div className="p-6 rounded-2xl" style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}>
          <div className="flex items-center gap-1.5 mb-5">
            {VIEWS.map((v) => (
              <button key={v.key} onClick={() => setView(v.key)}
                className="flex-1 text-[12.5px] font-medium px-3 py-2 rounded-xl whitespace-nowrap transition-colors"
                aria-pressed={view === v.key}
                style={view === v.key
                  ? { background: "#155e56", color: "#F6F3ED" }
                  : { background: "#F1EDE1", color: "#3c3a34" }}>
                {v.label}
              </button>
            ))}
          </div>

          {view === "weight" && (
            <>
              <TrendChart points={points} height={200} unit="kg" goalDirection="down" />
              {points.length < 2 && (
                <p className="text-xs mt-3 text-center" style={{ color: "#8b867c" }}>
                  Submit weekly check-ins to build your weight trend.
                </p>
              )}
            </>
          )}

          {view === "body" && <BodyCompositionChart rows={sorted as unknown as Measurements[]} />}

          {view === "wellbeing" && (() => {
            // Latest recorded value per metric, with the change since the first.
            const scored = WELLBEING.map((m) => {
              const vals = sorted
                .map((c) => c[m.key])
                .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
              if (vals.length === 0) return null
              const first = vals[0]
              const latest = vals[vals.length - 1]
              return { ...m, first, latest, delta: +(latest - first).toFixed(1) }
            }).filter(Boolean) as ({ label: string; max: number; suffix: string; first: number; latest: number; delta: number })[]

            if (scored.length === 0) {
              return (
                <p className="text-[12.5px] py-6 text-center" style={{ color: "#8b867c", lineHeight: 1.55 }}>
                  Your first check-in will fill this in.
                </p>
              )
            }

            const improved = scored.filter((m) => m.delta > 0).length
            return (
              <div>
                <p className="text-[12.5px] mb-4" style={{ color: improved > 0 ? "#155e56" : "#5a564e", lineHeight: 1.55 }}>
                  {scored.every((m) => m.delta === 0)
                    ? "How you're feeling right now. These often shift before the scale does."
                    : improved > 0
                      ? `${improved} of ${scored.length} improving since your first check-in.`
                      : "Worth mentioning to your coach — these often move before weight does."}
                </p>
                <div className="flex flex-col gap-2.5">
                  {scored.map((m) => {
                    // Up is better for every metric in this group.
                    const color = m.delta > 0 ? "#155e56" : m.delta < 0 ? "#97671b" : "#8b867c"
                    return (
                      <MetricBar key={m.label} label={m.label} pct={(m.latest / m.max) * 100} color={color} tone={`${color}22`}>
                        <span className="tabular-nums text-[12.5px]" style={{ color: "#1c1d20" }}>
                          {m.latest}{m.suffix}
                        </span>
                        <span className="tabular-nums text-[11.5px] font-semibold" style={{ color, minWidth: 42, textAlign: "right" }}>
                          {m.delta === 0 ? "—" : `${m.delta > 0 ? "↑" : "↓"} ${Math.abs(m.delta)}`}
                        </span>
                      </MetricBar>
                    )
                  })}
                </div>
                <p className="text-[11px] mt-4" style={{ color: "#a09a8e", lineHeight: 1.5 }}>
                  Bar length is where you are now. The arrow is the change since your first check-in.
                </p>
              </div>
            )
          })()}
        </div>

        {/* Thyroid symptoms — these usually shift before the scale does, so
            showing them is what carries a client through a weight plateau. */}
        {(() => {
          const scored = sorted
            .map((c) => ({ week: c.week_number, s: parseSymptoms(c.symptoms) }))
            .filter((x) => x.s !== null) as { week: number; s: NonNullable<ReturnType<typeof parseSymptoms>> }[]
          if (scored.length === 0) return null

          const first = scored[0]
          const latest = scored[scored.length - 1]
          const changes = symptomChanges(first.s, latest.s)
          const improved = changes.filter((c) => c.delta < 0).length
          const burdenPts: TrendPoint[] = scored
            .map((x) => ({ label: `W${x.week}`, value: symptomBurden(x.s) ?? NaN }))
            .filter((p) => Number.isFinite(p.value))

          return (
            <div className="p-6 rounded-2xl" style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}>
              <h3 className="font-semibold mb-1" style={{ color: "#1c1d20" }}>Symptoms</h3>
              {scored.length < 2 ? (
                <p className="text-[12.5px] mb-3" style={{ color: "#8b867c" }}>
                  Your first symptom check is logged — next week you&apos;ll start seeing what&apos;s changing.
                </p>
              ) : (
                <p className="text-[12.5px] mb-3" style={{ color: improved > 0 ? "#155e56" : "#8b867c" }}>
                  {improved > 0
                    ? `${improved} of ${changes.length} symptoms improved since week ${first.week}`
                    : "Holding steady — symptoms often shift before the scale does."}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {changes.map((c) => {
                  const better = c.delta < 0
                  const worse = c.delta > 0
                  const color = better ? "#155e56" : worse ? "#97671b" : "#8b867c"
                  const bg = better ? "rgba(21, 94, 86,0.1)" : worse ? "rgba(151, 103, 27,0.1)" : "#f4f0e8"
                  return (
                    <span key={c.key} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold rounded-full px-3 py-1.5"
                      style={{ color, background: bg, border: `1px solid ${better ? "rgba(21, 94, 86,0.2)" : worse ? "rgba(151, 103, 27,0.2)" : "#e2dbcd"}` }}>
                      {c.short}
                      <span style={{ opacity: 0.85 }}>
                        {better ? `↓${Math.abs(c.delta)}` : worse ? `↑${c.delta}` : "—"}
                      </span>
                    </span>
                  )
                })}
              </div>

              {burdenPts.length >= 2 && (
                <>
                  <p className="text-[10.5px] uppercase font-semibold mb-1.5" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>
                    Total symptom load
                  </p>
                  <TrendChart points={burdenPts} height={130} goalDirection="down" color="#155e56" />
                  <p className="text-[11px] mt-2" style={{ color: "#a09a8e" }}>Lower is better — 0 means symptom-free.</p>
                </>
              )}
            </div>
          )
        })()}

        {/* Milestones — earned from real check-in data only */}
        {(() => {
          const milestones: { label: string; done: boolean }[] = []
          if (sorted.length >= 1) milestones.push({ label: "First check-in logged", done: true })
          if (sorted.length >= 4) milestones.push({ label: "4 weeks consistent", done: true })
          else milestones.push({ label: "4 weeks consistent — soon", done: false })
          if (lost != null && lost >= 1) milestones.push({ label: "First kg down", done: true })
          else if (lost != null) milestones.push({ label: "First kg down — soon", done: false })
          if (lost != null && lost >= 3) milestones.push({ label: "3 kg down", done: true })
          if (sorted.length >= 8) milestones.push({ label: "8 weeks strong", done: true })
          if (milestones.length === 0) return null
          return (
            <div>
              <p className="text-[10.5px] uppercase font-semibold mb-2.5 ml-0.5" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>Milestones</p>
              <div className="flex flex-wrap gap-2">
                {milestones.map((m) => (
                  <span
                    key={m.label}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold rounded-full px-3 py-1.5"
                    style={m.done
                      ? { color: "#155e56", background: "rgba(21, 94, 86,0.1)", border: "1px solid rgba(21, 94, 86,0.2)" }
                      : { color: "#a09a8e", border: "1px dashed #cfc7b6" }}
                  >
                    {m.done && (
                      <svg width="11" height="11" viewBox="0 0 24 24"><path d="M4.5 12.5l5 5L19.5 7" style={{ fill: "none", stroke: "#155e56", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" }} /></svg>
                    )}
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/dashboard/progress-photos/compare" className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold" style={{ background: "rgba(21, 94, 86,0.1)", border: "1px solid rgba(21, 94, 86,0.25)", color: "#155e56" }}>
            Before &amp; after
          </Link>
          <Link href="/dashboard/progress-photos" className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-medium" style={{ background: "#F1EDE1", border: "1px solid #e2dbcd", color: "#1c1d20" }}>
            Add photos
          </Link>
        </div>

        <p className="text-xs px-1" style={{ color: "#a09a8e" }}>
          The scale moves slowly with thyroid — energy, sleep and mood often improve first. Watch all of them, not just weight.
        </p>
      </main>
    </div>
  )
}
