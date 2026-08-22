/**
 * Free, client-side lab-report parser. Takes raw text (from a PDF text layer
 * or OCR) and pattern-matches known tests with their value, unit, and the
 * reference range PRINTED on the report. No AI, no server, no cost — and the
 * report never leaves the client's device.
 *
 * Accuracy is deliberately conservative: anything ambiguous is skipped rather
 * than guessed, because every extraction is shown on an editable confirmation
 * screen before saving.
 */

export interface ParsedLab {
  key: string | null      // core column key (tsh, t3, …) or null for extras-only
  name: string            // display name
  value: number
  unit: string | null
  low: number | null      // reference range from the report (or standard fallback)
  high: number | null
}

interface TestDef {
  key: string | null
  name: string
  /** Lowercase substrings that identify the test on a report line. */
  aliases: string[]
  /** Aliases that must NOT be present (disambiguation). */
  exclude?: string[]
  unit?: string
  /** Standard fallback range when the report's own range isn't found. */
  low?: number
  high?: number
  /** Sanity bounds — values outside are treated as misreads and skipped. */
  min: number
  max: number
}

// Order matters: more specific names first so "free t4" wins over "t4".
const TESTS: TestDef[] = [
  { key: "tsh", name: "TSH", aliases: ["tsh", "thyroid stimulating"], unit: "mIU/L", low: 0.4, high: 4.0, min: 0.001, max: 150 },
  { key: "t3", name: "Free T3", aliases: ["free t3", "ft3", "free triiodo"], unit: "pg/mL", low: 2.0, high: 4.4, min: 0.1, max: 30 },
  { key: "t4", name: "Free T4", aliases: ["free t4", "ft4", "free thyroxine"], unit: "ng/dL", low: 0.8, high: 1.8, min: 0.05, max: 30 },
  { key: "t3", name: "T3 (Total)", aliases: ["triiodothyronine", "t3, total", "t3 total", "total t3"], exclude: ["free"], unit: "ng/dL", low: 80, high: 200, min: 10, max: 800 },
  { key: "t4", name: "T4 (Total)", aliases: ["thyroxine", "t4, total", "t4 total", "total t4"], exclude: ["free"], unit: "µg/dL", low: 5.1, high: 14.1, min: 0.5, max: 40 },
  { key: null, name: "Anti-TPO", aliases: ["anti tpo", "anti-tpo", "tpo antibod", "thyroid peroxidase"], unit: "IU/mL", low: 0, high: 34, min: 0, max: 20000 },
  { key: "vitamin_d", name: "Vitamin D (25-OH)", aliases: ["vitamin d", "25-oh", "25 oh", "25-hydroxy"], unit: "ng/mL", low: 30, high: 100, min: 1, max: 400 },
  { key: "b12", name: "Vitamin B12", aliases: ["b12", "b-12", "cobalamin"], unit: "pg/mL", low: 200, high: 900, min: 20, max: 5000 },
  { key: "ferritin", name: "Ferritin", aliases: ["ferritin"], unit: "ng/mL", low: 15, high: 150, min: 0.5, max: 3000 },
  { key: null, name: "Hemoglobin", aliases: ["haemoglobin", "hemoglobin", "hb "], exclude: ["a1c", "glycated", "glyco"], unit: "g/dL", low: 12, high: 15.5, min: 3, max: 25 },
  { key: null, name: "HbA1c", aliases: ["hba1c", "a1c", "glycated hemoglobin", "glycated haemoglobin", "glycosylated"], unit: "%", low: 4, high: 5.7, min: 2, max: 20 },
  { key: null, name: "Fasting Glucose", aliases: ["glucose fasting", "fasting glucose", "glucose, fasting", "fbs", "fasting blood sugar"], unit: "mg/dL", low: 70, high: 100, min: 20, max: 600 },
  { key: null, name: "Total Cholesterol", aliases: ["total cholesterol", "cholesterol total", "cholesterol, total"], unit: "mg/dL", low: 0, high: 200, min: 40, max: 600 },
  { key: null, name: "LDL", aliases: ["ldl"], unit: "mg/dL", low: 0, high: 100, min: 5, max: 400 },
  { key: null, name: "HDL", aliases: ["hdl"], unit: "mg/dL", low: 40, high: 100, min: 5, max: 200 },
  { key: null, name: "Triglycerides", aliases: ["triglyceride"], unit: "mg/dL", low: 0, high: 150, min: 10, max: 2000 },
  { key: null, name: "Creatinine", aliases: ["creatinine"], unit: "mg/dL", low: 0.6, high: 1.2, min: 0.1, max: 20 },
  { key: null, name: "Iron", aliases: ["iron, serum", "serum iron", "iron -"], unit: "µg/dL", low: 50, high: 170, min: 5, max: 800 },
]

const NUM = /-?\d+(?:[.,]\d+)?/g

function toNum(s: string): number | null {
  const n = Number(s.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

/** Find "0.4 - 4.0" / "0.4–4.0" / "(30 to 100)" style ranges in a line. */
function findRange(line: string, value: number): { low: number; high: number } | null {
  const m = line.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:[.,]\d+)?)/i)
  if (!m) return null
  const low = toNum(m[1]), high = toNum(m[2])
  if (low === null || high === null || low >= high) return null
  // A "range" equal to the value itself is probably a date or page artifact.
  if (low === value && high === value) return null
  return { low, high }
}

/**
 * Parse raw report text into recognized lab values. Lines are scanned for a
 * known test alias; the first plausible number after the alias becomes the
 * value; a low–high pair later on the line becomes the printed range.
 */
export function parseLabText(text: string): ParsedLab[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const found = new Map<string, ParsedLab>()

  for (const rawLine of lines) {
    const line = rawLine.toLowerCase()
    for (const t of TESTS) {
      if (found.has(t.name)) continue
      const hitAlias = t.aliases.find((a) => line.includes(a))
      if (!hitAlias) continue
      if (t.exclude?.some((x) => line.includes(x))) continue

      // Look at the text after the alias for the value (falls back to whole line).
      const after = rawLine.slice(line.indexOf(hitAlias) + hitAlias.length)
      const nums = (after.match(NUM) || rawLine.match(NUM) || []).map(toNum).filter((n): n is number => n !== null)
      // First number within the test's sanity bounds is the value.
      const value = nums.find((n) => n >= t.min && n <= t.max)
      if (value === undefined) continue

      const range = findRange(after, value) || findRange(rawLine, value)
      found.set(t.name, {
        key: t.key,
        name: t.name,
        value,
        unit: t.unit || null,
        low: range?.low ?? t.low ?? null,
        high: range?.high ?? t.high ?? null,
      })
    }
  }

  return [...found.values()]
}

/**
 * Group a test into a panel for display. Extras are stored with only
 * {name, value, unit, low, high} — no panel — so this classifies by name at
 * render time, which also works for older rows saved before panels existed.
 */
export type Panel = "Thyroid" | "Vitamins & minerals" | "Metabolic" | "Blood" | "Other"

export function panelFor(name: string): Panel {
  const s = name.toLowerCase()
  if (/tsh|t3|t4|thyro|tpo/.test(s)) return "Thyroid"
  if (/vitamin|b12|b-12|cobalamin|ferritin|iron|folate/.test(s)) return "Vitamins & minerals"
  if (/hba1c|a1c|glucose|cholesterol|ldl|hdl|triglyceride|lipid|insulin/.test(s)) return "Metabolic"
  if (/h(a)?emoglobin|hb\b|rbc|wbc|platelet|creatinine|esr/.test(s)) return "Blood"
  return "Other"
}

/** Display order — thyroid first, since that's what the client is here for. */
export const PANEL_ORDER: Panel[] = ["Thyroid", "Vitamins & minerals", "Metabolic", "Blood", "Other"]

/** Standard fallback ranges for gauges on manually-entered core tests. */
export const CORE_RANGES: Record<string, { name: string; unit: string; low: number; high: number }> = {
  tsh: { name: "TSH", unit: "mIU/L", low: 0.4, high: 4.0 },
  t3: { name: "T3", unit: "", low: 2.0, high: 4.4 },
  t4: { name: "T4", unit: "", low: 0.8, high: 1.8 },
  vitamin_d: { name: "Vitamin D", unit: "ng/mL", low: 30, high: 100 },
  b12: { name: "Vitamin B12", unit: "pg/mL", low: 200, high: 900 },
  ferritin: { name: "Ferritin", unit: "ng/mL", low: 15, high: 150 },
}
