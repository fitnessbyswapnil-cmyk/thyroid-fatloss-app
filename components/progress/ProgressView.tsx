"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingDown } from "lucide-react"
import { TrendChart, type TrendPoint } from "@/components/charts/TrendChart"

export interface CheckinPoint {
  week_number: number
  weight: number | null
  waist: number | null
  hips: number | null
  energy_level: number | null
  sleep_score: number | null
  mood: number | null
  digestion_score: number | null
  adherence_score: number | null
  steps: number | null
}

const METRICS: { key: keyof CheckinPoint; label: string; unit: string; goal?: "down" | "up" }[] = [
  { key: "weight", label: "Weight", unit: "kg", goal: "down" },
  { key: "waist", label: "Waist", unit: "cm", goal: "down" },
  { key: "hips", label: "Hips", unit: "cm", goal: "down" },
  { key: "energy_level", label: "Energy", unit: "/10", goal: "up" },
  { key: "sleep_score", label: "Sleep", unit: "/10", goal: "up" },
  { key: "mood", label: "Mood", unit: "/10", goal: "up" },
  { key: "digestion_score", label: "Digestion", unit: "/10", goal: "up" },
  { key: "adherence_score", label: "Adherence", unit: "%", goal: "up" },
  { key: "steps", label: "Steps", unit: "", goal: "up" },
]

export function ProgressView({ checkins, backHref = "/dashboard" }: { checkins: CheckinPoint[]; backHref?: string }) {
  const [metric, setMetric] = useState<keyof CheckinPoint>("weight")
  const meta = METRICS.find((m) => m.key === metric)!

  const sorted = [...checkins].sort((a, b) => a.week_number - b.week_number)
  const points: TrendPoint[] = sorted
    .filter((c) => c[metric] != null)
    .map((c) => ({ label: `W${c.week_number}`, value: Number(c[metric]) }))

  const weightPts = sorted.filter((c) => c.weight != null)
  const startW = weightPts[0]?.weight ?? null
  const nowW = weightPts[weightPts.length - 1]?.weight ?? null
  const lost = startW != null && nowW != null ? +(startW - nowW).toFixed(1) : null

  return (
    <div className="min-h-screen" style={{ background: "#090c14", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}>
      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(9,12,20,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={backHref} className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>My Progress</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {/* Headline stat */}
        {lost != null && (
          <div className="p-6 rounded-2xl flex items-center gap-4" style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.15)" }}>
              <TrendingDown size={24} style={{ color: "#2dd4bf" }} />
            </div>
            <div>
              <p className="text-3xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>
                {lost > 0 ? `${lost} kg down` : lost < 0 ? `${Math.abs(lost)} kg up` : "Holding steady"}
              </p>
              <p className="text-xs" style={{ color: "#7e8a9e" }}>
                From {startW} kg to {nowW} kg over {weightPts.length} check-ins
              </p>
            </div>
          </div>
        )}

        <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-4 pb-0.5">
            {METRICS.map((m) => (
              <button key={m.key} onClick={() => setMetric(m.key)} className="shrink-0 text-[12px] font-medium px-3 py-1 rounded-full whitespace-nowrap"
                style={metric === m.key ? { background: "#2dd4bf", color: "#04121a" } : { background: "rgba(255,255,255,0.05)", color: "#c9cdd5" }}>
                {m.label}
              </button>
            ))}
          </div>
          <TrendChart points={points} height={200} unit={meta.unit} goalDirection={meta.goal} />
          {points.length < 2 && (
            <p className="text-xs mt-3 text-center" style={{ color: "#7e8a9e" }}>
              Submit weekly check-ins to build your {meta.label.toLowerCase()} trend.
            </p>
          )}
        </div>

        <Link href="/dashboard/progress-photos" className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" }}>
          View progress photos
        </Link>

        <p className="text-xs px-1" style={{ color: "#5a6578" }}>
          The scale moves slowly with thyroid — energy, sleep and mood often improve first. Watch all of them, not just weight.
        </p>
      </main>
    </div>
  )
}
