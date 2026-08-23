"use client"

import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import type { LabResult, LabExtra } from "@/app/actions/health"
import { CORE_RANGES, panelFor } from "@/lib/labs/parse"

/**
 * "What changed since my last report" — the view a client actually wants when
 * a second set of bloods comes back, and the one that makes three months of
 * coaching feel like it worked.
 *
 * Deliberately compares only markers present in BOTH reports: labs run
 * different panels each time, and inventing a comparison against a missing
 * value would be worse than omitting the row.
 */

type Marker = LabExtra

function markersOf(lab: LabResult): Marker[] {
  if (lab.extras?.length) return lab.extras
  const out: Marker[] = []
  for (const [key, def] of Object.entries(CORE_RANGES)) {
    const v = lab[key as keyof LabResult]
    if (typeof v === "number" && Number.isFinite(v)) {
      out.push({ name: def.name, value: v, unit: def.unit || null, low: def.low, high: def.high })
    }
  }
  return out
}

const inRange = (m: Marker) =>
  m.low === null || m.high === null ? null : m.value >= m.low && m.value <= m.high

/** Distance outside the range (0 when inside) — lets us say "moved closer". */
function outByHowMuch(m: Marker): number {
  if (m.low === null || m.high === null) return 0
  if (m.value < m.low) return m.low - m.value
  if (m.value > m.high) return m.value - m.high
  return 0
}

type Verdict = "now-in-range" | "improved" | "stable" | "worsened" | "now-out-of-range" | "no-range"

interface Change {
  name: string
  unit: string | null
  prev: number
  latest: number
  delta: number
  verdict: Verdict
}

function classify(prev: Marker, latest: Marker): Change {
  const delta = +(latest.value - prev.value).toFixed(2)
  const wasIn = inRange(prev)
  const isIn = inRange(latest)

  let verdict: Verdict
  if (wasIn === null || isIn === null) {
    // No reference range on the report, so "better" is undefined. Report the
    // movement and stay silent on whether it's good — guessing would be worse
    // than saying nothing on someone's bloodwork.
    verdict = "no-range"
  } else if (!wasIn && isIn) {
    verdict = "now-in-range"
  } else if (wasIn && !isIn) {
    verdict = "now-out-of-range"
  } else {
    const before = outByHowMuch(prev)
    const after = outByHowMuch(latest)
    verdict = after < before ? "improved" : after > before ? "worsened" : "stable"
  }

  return { name: latest.name, unit: latest.unit, prev: prev.value, latest: latest.value, delta, verdict }
}

const TONE: Record<Verdict, { color: string; label: string }> = {
  "now-in-range": { color: "#34d399", label: "Now in range" },
  improved: { color: "#34d399", label: "Improved" },
  stable: { color: "#7e8a9e", label: "Stable" },
  worsened: { color: "#f59e0b", label: "Worse" },
  "now-out-of-range": { color: "#fb7185", label: "Now out of range" },
  "no-range": { color: "#7e8a9e", label: "Changed" },
}

// Most meaningful first: range crossings, then movement, then the rest.
const RANK: Record<Verdict, number> = {
  "now-in-range": 0, "now-out-of-range": 1, improved: 2, worsened: 3, stable: 4, "no-range": 5,
}

export function LabDeltas({ labs }: { labs: LabResult[] }) {
  if (labs.length < 2) return null
  const sorted = [...labs].sort((a, b) => a.taken_on.localeCompare(b.taken_on))
  const previous = sorted[sorted.length - 2]
  const latest = sorted[sorted.length - 1]

  const prevByName = new Map(markersOf(previous).map((m) => [m.name.toLowerCase(), m]))
  const changes = markersOf(latest)
    .map((m) => {
      const p = prevByName.get(m.name.toLowerCase())
      return p ? classify(p, m) : null
    })
    .filter((c): c is Change => c !== null)
    .sort((a, b) => RANK[a.verdict] - RANK[b.verdict] || panelFor(a.name).localeCompare(panelFor(b.name)))

  if (!changes.length) return null

  const wins = changes.filter((c) => c.verdict === "now-in-range" || c.verdict === "improved").length
  const gap = Math.round(
    (new Date(latest.taken_on).getTime() - new Date(previous.taken_on).getTime()) / 86400000
  )
  const d = (s: string) => new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })

  return (
    <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>What changed</h3>
      <p className="text-[11.5px] mt-0.5 mb-1" style={{ color: "#5a6578" }}>
        {d(previous.taken_on)} → {d(latest.taken_on)} · {gap} days apart
      </p>
      <p className="text-[12.5px] mb-4" style={{ color: wins > 0 ? "#34d399" : "#7e8a9e" }}>
        {wins > 0
          ? `${wins} of ${changes.length} markers moved in the right direction`
          : "No clear movement yet — worth discussing with your doctor"}
      </p>

      <div className="space-y-2">
        {changes.map((c, i) => {
          const tone = TONE[c.verdict]
          const Icon = c.delta < 0 ? ArrowDown : c.delta > 0 ? ArrowUp : Minus
          return (
            <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="flex-1 min-w-0 text-sm truncate" style={{ color: "#e8eaf0" }}>{c.name}</span>
              <span className="text-[11.5px] tabular-nums shrink-0" style={{ color: "#5a6578" }}>
                {c.prev} → <span style={{ color: "#a9b2c1" }}>{c.latest}</span>{c.unit ? ` ${c.unit}` : ""}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-1 shrink-0"
                style={{ color: tone.color, background: `${tone.color}1f` }}>
                <Icon size={10} strokeWidth={3} /> {tone.label}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[10.5px] mt-4" style={{ color: "#5a6578" }}>
        Compared against the range printed on each report. Your doctor interprets these — this is tracking.
      </p>
    </div>
  )
}
