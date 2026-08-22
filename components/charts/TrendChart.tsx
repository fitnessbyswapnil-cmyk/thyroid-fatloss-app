"use client"

/**
 * Dependency-free SVG line chart for time-series (labs, weight, measurements).
 * Renders a smooth-ish polyline with dots, min/max guides and date labels.
 * Reused by the Health/Labs screen and the progress charts.
 */
export interface TrendPoint {
  label: string   // x-axis label (e.g. "12 Aug")
  value: number
}

export function TrendChart({
  points,
  color = "#155e56",
  height = 160,
  unit = "",
  goalDirection,
  band,
}: {
  points: TrendPoint[]
  color?: string
  height?: number
  unit?: string
  goalDirection?: "down" | "up" // colour the net change good/bad
  band?: { min: number; max: number; label?: string } // shaded target range (e.g. TSH 0.4–4.0)
}) {
  const clean = points.filter((p) => typeof p.value === "number" && !Number.isNaN(p.value))
  if (clean.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl" style={{ height, background: "#ffffff", color: "#a09a8e", fontSize: 13 }}>
        No data yet
      </div>
    )
  }

  const W = 320, H = height, padX = 30, padY = 18
  const values = clean.map((p) => p.value)
  // Include the target band in the scale so it's always visible.
  const min = Math.min(...values, ...(band ? [band.min] : []))
  const max = Math.max(...values, ...(band ? [band.max] : []))
  const span = max - min || 1
  const innerW = W - padX * 2, innerH = H - padY * 2
  const x = (i: number) => padX + (clean.length === 1 ? innerW / 2 : (i / (clean.length - 1)) * innerW)
  const y = (v: number) => padY + innerH - ((v - min) / span) * innerH

  const line = clean.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ")
  const area = `${line} L ${x(clean.length - 1).toFixed(1)} ${padY + innerH} L ${x(0).toFixed(1)} ${padY + innerH} Z`

  const first = clean[0].value, last = clean[clean.length - 1].value
  const delta = last - first
  const good = goalDirection ? (goalDirection === "down" ? delta < 0 : delta > 0) : undefined
  const deltaColor = good === undefined ? "#8b867c" : good ? "#155e56" : "#9a3b2e"

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Target band (prototype style: shaded range + dashed ceiling) */}
        {band && (
          <g>
            <rect x={padX} y={y(band.max)} width={innerW} height={Math.max(2, y(band.min) - y(band.max))} rx="5" fill="rgba(21, 94, 86,0.05)" />
            <line x1={padX} y1={y(band.max)} x2={padX + innerW} y2={y(band.max)} stroke="rgba(21, 94, 86,0.35)" strokeWidth="1" strokeDasharray="4 4" />
            {band.label && (
              <text x={padX + innerW} y={y(band.max) - 5} fontSize="9" fill="#a09a8e" textAnchor="end">{band.label}</text>
            )}
          </g>
        )}
        <path d={area} fill={`url(#grad-${color.replace("#", "")})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {clean.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill={color} />
        ))}
        {/* max & min value labels */}
        <text x="2" y={y(max) + 4} fontSize="9" fill="#a09a8e">{max}{unit}</text>
        <text x="2" y={y(min) + 4} fontSize="9" fill="#a09a8e">{min}{unit}</text>
      </svg>
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[11px]" style={{ color: "#a09a8e" }}>{clean[0].label}</span>
        {clean.length > 1 && (
          <span className="text-[11px] tabular-nums" style={{ color: deltaColor }}>
            {delta > 0 ? "+" : ""}{Number(delta.toFixed(1))}{unit} overall
          </span>
        )}
        <span className="text-[11px]" style={{ color: "#a09a8e" }}>{clean[clean.length - 1].label}</span>
      </div>
    </div>
  )
}
