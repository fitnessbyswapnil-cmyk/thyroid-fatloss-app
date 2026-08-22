"use client"

import type { LabResult, LabExtra } from "@/app/actions/health"
import { CORE_RANGES, panelFor, PANEL_ORDER } from "@/lib/labs/parse"

/**
 * Range-gauge cards for the latest lab report: each test shows its value as a
 * marker on a bar with the normal range shaded, plus an in/out-of-range badge.
 * Uses the range printed on the client's own report when available (extras),
 * standard fallbacks for manually-entered core values.
 */

interface Gauge extends LabExtra {}

function gaugesFrom(lab: LabResult): Gauge[] {
  if (lab.extras?.length) return lab.extras
  // Manual entry: build gauges from the core columns.
  const out: Gauge[] = []
  for (const [key, def] of Object.entries(CORE_RANGES)) {
    const v = lab[key as keyof LabResult]
    if (typeof v === "number" && Number.isFinite(v)) {
      out.push({ name: def.name, value: v, unit: def.unit || null, low: def.low, high: def.high })
    }
  }
  return out
}

function status(g: Gauge): { label: string; color: string; bg: string } {
  if (g.low === null || g.high === null) return { label: "No range", color: "#8b867c", bg: "#f4f0e8" }
  if (g.value < g.low) return { label: "Low", color: "#A32B23", bg: "rgba(154, 59, 46,0.1)" }
  if (g.value > g.high) return { label: "High", color: "#A32B23", bg: "rgba(154, 59, 46,0.1)" }
  const span = g.high - g.low
  const edge = Math.min(g.value - g.low, g.high - g.value)
  if (span > 0 && edge / span < 0.08) return { label: "Borderline", color: "#97671b", bg: "rgba(151, 103, 27,0.1)" }
  return { label: "In range", color: "#155e56", bg: "rgba(21, 94, 86,0.1)" }
}

function GaugeBar({ g }: { g: Gauge }) {
  if (g.low === null || g.high === null) return null
  const span = g.high - g.low
  // Scale extends past the band so out-of-range markers stay visible.
  const pad = Math.max(span * 0.35, Math.abs(g.value - (g.low + span / 2)) * 0.15)
  const min = Math.min(g.low - pad, g.value)
  const max = Math.max(g.high + pad, g.value)
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const s = status(g)

  return (
    <div className="mt-3">
      <div className="relative h-2.5 rounded-full" style={{ background: "#e2dbcd" }}>
        <div className="absolute top-0 bottom-0 rounded-full" style={{ left: `${pct(g.low)}%`, width: `${pct(g.high) - pct(g.low)}%`, background: "rgba(21, 94, 86,0.22)", border: "1px solid rgba(21, 94, 86,0.25)" }} />
        <div className="absolute top-1/2" style={{ left: `${pct(g.value)}%`, transform: "translate(-50%,-50%)" }}>
          <div className="w-4 h-4 rounded-full" style={{ background: s.color, border: "2.5px solid #ffffff", boxShadow: `0 0 12px ${s.color}66` }} />
        </div>
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] tabular-nums" style={{ color: "#a09a8e" }}>{g.low}</span>
        <span className="text-[10px]" style={{ color: "#a09a8e" }}>normal range</span>
        <span className="text-[10px] tabular-nums" style={{ color: "#a09a8e" }}>{g.high}</span>
      </div>
    </div>
  )
}

export function LabGauges({ lab }: { lab: LabResult }) {
  const gauges = gaugesFrom(lab)
  if (!gauges.length) return null
  const flagged = gauges.filter((g) => { const s = status(g); return s.label === "Low" || s.label === "High" }).length

  return (
    <div className="p-6 rounded-2xl" style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold" style={{ color: "#1c1d20" }}>Latest report</h3>
        <span className="text-[11px]" style={{ color: "#8b867c" }}>
          {new Date(lab.taken_on).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      <p className="text-[11.5px] mb-4" style={{ color: flagged ? "#97671b" : "#155e56" }}>
        {flagged
          ? `${flagged} value${flagged === 1 ? "" : "s"} outside range — worth discussing with your doctor`
          : "All tracked values in range"}
      </p>

      {/* Grouped by panel — a flat list of 15 markers is unreadable, and a
          client scanning for her thyroid numbers shouldn't have to hunt. */}
      <div className="space-y-5">
        {PANEL_ORDER.map((panel) => {
          const inPanel = gauges.filter((g) => panelFor(g.name) === panel)
          if (!inPanel.length) return null
          return (
            <div key={panel}>
              <p className="text-[10px] uppercase font-semibold mb-2 ml-0.5" style={{ color: "#8b867c", letterSpacing: "0.14em" }}>
                {panel}
              </p>
              <div className="space-y-2.5">
                {inPanel.map((g, i) => {
                  const s = status(g)
                  return (
                    <div key={i} className="p-3.5 rounded-xl" style={{ background: "#FDFBF7", border: "1px solid #f4f0e8" }}>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-medium truncate" style={{ color: "#1c1d20" }}>{g.name}</span>
                        <span className="tabular-nums" style={{ fontFamily: "'Newsreader', Georgia, serif",  fontSize: 20, color: "#1c1d20" }}>
                          {g.value}
                        </span>
                        {g.unit && <span className="text-[10.5px]" style={{ color: "#8b867c" }}>{g.unit}</span>}
                        <span className="text-[10px] font-bold rounded-full px-2 py-1 shrink-0" style={{ color: s.color, background: s.bg }}>{s.label}</span>
                      </div>
                      <GaugeBar g={g} />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10.5px] mt-4" style={{ color: "#a09a8e" }}>
        Ranges come from your own report when available. This is tracking, not medical advice.
      </p>
    </div>
  )
}
