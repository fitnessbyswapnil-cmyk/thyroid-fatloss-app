'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { deltaTone, levelTone } from '@/lib/coach/delta-tone'
import {
  ChevronDown,
  ChevronLeft,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Award,
  AlertCircle,
} from 'lucide-react'
import { submitWeeklyCheckIn } from '@/app/actions/submit-checkin'
import { SYMPTOMS, SEVERITY_LABELS, parseSymptoms, type SymptomScores } from '@/lib/health/symptoms'
import { SITES, type Measurements } from '@/lib/health/measurements'
import { useRevealScale } from '@/components/ui/stagger'
import { toLabel, DIGESTION, BLOATING, CRAVINGS, ADHERENCE } from '@/lib/health/checkin-scales'

// Types for check-in data
interface CheckInData {
  energy: number
  mood: number // 1-5
  sleepQuality: number
  stress: number
  digestion: string
  bloating: string
  cravings: string
  nutritionAdherence: string
  workoutsCompleted: number
  workoutsTarget: number
  medsTaken: number
  medsTarget: number
  weight?: number
  /** Average daily steps for the week; optional. */
  steps?: number
  /** Body sites in cm; any subset — the step is skippable. */
  measurements: Measurements
  symptoms: SymptomScores
  reflectionText: string
  /** Which questions she actually answered; everything else is sent as blank. */
  touched: string[]
}

// Step components
interface StepProps {
  data: CheckInData
  setData: (data: CheckInData) => void
  onNext: () => void
}

// Tap scales — five buttons, one tap, no slider to drag.
const FIVE = [1, 2, 3, 4, 5] as const
function TapScale({ label, low, high, value, onPick }: { label: string; low: string; high: string; value: number | null; onPick: (n: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-medium" style={{ color: '#e8eaf0' }}>{label}</span>
        <span className="text-[11px]" style={{ color: '#5a6578' }}>{low} → {high}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {FIVE.map((n) => {
          const on = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              aria-pressed={on}
              aria-label={`${label} ${n} of 5`}
              className="h-12 rounded-xl text-[15px] font-semibold active:scale-[0.97] transition-transform"
              style={{
                background: on ? 'rgba(45,212,191,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${on ? 'rgba(45,212,191,0.55)' : 'rgba(255,255,255,0.08)'}`,
                color: on ? '#e8eaf0' : '#7e8a9e',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const touch = (d: CheckInData, ...keys: string[]): string[] => Array.from(new Set([...d.touched, ...keys]))
/** 1–10 scales are asked on five buttons: 1→2 … 5→10. */
const toTen = (n: number) => n * 2
const fromTen = (v: number, touched: boolean) => (touched ? Math.min(5, Math.max(1, Math.round(v / 2))) : null)

// Step: how the week felt — energy, sleep, mood.
function FeelStep({ data, setData, onNext, onMore }: StepProps & { onMore: () => void }) {
  const t = (k: string) => data.touched.includes(k)
  return (
    <div className="space-y-7 px-6 py-6">
      <div>
        <h2 className="text-[22px] font-semibold" style={{ color: '#e8eaf0' }}>How did this week feel?</h2>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>One tap on each. 1 is low, 5 is great.</p>
      </div>
      <TapScale label="Energy" low="Drained" high="Full of it" value={fromTen(data.energy, t('energy'))}
        onPick={(n) => setData({ ...data, energy: toTen(n), touched: touch(data, 'energy') })} />
      <TapScale label="Sleep" low="Poor" high="Deep" value={fromTen(data.sleepQuality, t('sleepQuality'))}
        onPick={(n) => setData({ ...data, sleepQuality: toTen(n), touched: touch(data, 'sleepQuality') })} />
      <TapScale label="Mood" low="Low" high="Good" value={t('mood') ? data.mood : null}
        onPick={(n) => setData({ ...data, mood: n, touched: touch(data, 'mood') })} />
      <div className="flex flex-col gap-2 pt-2">
        <button onClick={onNext} className="w-full h-14 rounded-full font-bold text-base" style={{ background: '#2dd4bf', color: '#06231f' }}>
          Next
        </button>
        <button onClick={onMore} className="w-full h-11 text-sm" style={{ color: '#8892a4' }}>
          Add more detail — symptoms, digestion, habits
        </button>
      </div>
    </div>
  )
}

// Optional detail step: stress, on the same five-button scale.
function StressStep({ data, setData, onNext }: StepProps) {
  // Stress is stored 1–10 where high is bad; the buttons read 1 calm → 5 very stressed.
  const picked = data.touched.includes('stress') ? Math.min(5, Math.max(1, Math.round(data.stress / 2))) : null
  return (
    <div className="space-y-7 px-6 py-6">
      <h2 className="text-[22px] font-semibold" style={{ color: '#e8eaf0' }}>How stressful was the week?</h2>
      <TapScale label="Stress" low="Calm" high="Very stressed" value={picked}
        onPick={(n) => setData({ ...data, stress: toTen(n), touched: touch(data, 'stress') })} />
      <button onClick={onNext} className="w-full h-14 rounded-full font-bold text-base" style={{ background: '#2dd4bf', color: '#06231f' }}>
        Next
      </button>
    </div>
  )
}

// Step 2: Body
function BodyStep({ data, setData, onNext }: StepProps) {
  const ChipGroup = ({
    label,
    options,
    value,
    onChange,
  }: {
    label: string
    options: string[]
    value: string
    onChange: (val: string) => void
  }) => (
    <div className="space-y-3">
      <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <motion.button
            key={opt}
            onClick={() => onChange(opt)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: value === opt ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${value === opt ? 'rgba(45, 212, 191, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
              color: value === opt ? '#2dd4bf' : '#8892a4',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  )

  return (
    <motion.div
      // Container does not fade: with rAF paused this would stay at 0.
      initial={false}
      className="space-y-6 px-6 py-8"
    >
      <ChipGroup
        label="Digestion"
        options={['Great', 'Okay', 'Sluggish', 'Off']}
        value={data.digestion}
        onChange={(val) => setData({ ...data, digestion: val })}
      />
      <ChipGroup
        label="Bloating"
        options={['None', 'Mild', 'Moderate', 'Severe']}
        value={data.bloating}
        onChange={(val) => setData({ ...data, bloating: val })}
      />
      <ChipGroup
        label="Cravings"
        options={['Low', 'Manageable', 'Intense']}
        value={data.cravings}
        onChange={(val) => setData({ ...data, cravings: val })}
      />

      <motion.button
        onClick={onNext}
        className="w-full py-4 rounded-full font-semibold text-base text-white mt-8"
        style={{
          background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
          boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
        }}
        whileHover={{ transform: 'translateY(-2px)' }}
        whileTap={{ scale: 0.98 }}
      >
        Next
      </motion.button>
    </motion.div>
  )
}

/** A week is seven days, so no target this flow collects can sensibly exceed it. */
const TARGET_MAX = 7

/**
 * Lives at module scope, not inside ActionsStep. Redefined per render it is a
 * new component type each keystroke, which remounts the target field and takes
 * the caret with it.
 */
function Counter({
  label,
  value,
  target,
  onChange,
  onTargetChange,
}: {
  label: string
  value: number
  target: number
  onChange: (val: number) => void
  /** Supplied only where the target is the coach's programming rather than a constant. */
  onTargetChange?: (val: number) => void
}) {
  // The field needs to hold "" while she clears it before typing the new number.
  const [draft, setDraft] = useState(String(target))
  useEffect(() => { setDraft(String(target)) }, [target])

  const commit = (raw: string) => {
    const n = parseInt(raw, 10)
    // A cleared field is her mid-edit, not a plan of one session. Reading it as 1
    // would clamp the workouts she has already recorded down to 1 with it.
    const next = Number.isFinite(n) ? Math.min(TARGET_MAX, Math.max(1, n)) : target
    // The effect above only fires when the target actually moves, so a clamped
    // entry that lands back on the current one (9 against a target of 7) would
    // otherwise leave the wrong number sitting in the field.
    setDraft(String(next))
    onTargetChange?.(next)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
        {label}
      </label>
      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
        <span className="flex items-center gap-1.5" style={{ color: '#8892a4' }}>
          <span className="tabular-nums">{value}</span>
          <span>of</span>
          {onTargetChange ? (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 1))}
              onBlur={(e) => commit(e.target.value)}
              inputMode="numeric"
              aria-label={`${label} planned for the week`}
              className="w-9 px-2 py-0.5 rounded-lg text-center tabular-nums focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eaf0' }}
            />
          ) : (
            <span className="tabular-nums">{target}</span>
          )}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onChange(Math.max(0, value - 1))}
            className="px-3 py-1 rounded-lg font-semibold"
            style={{
              background: 'rgba(45, 212, 191, 0.15)',
              color: '#2dd4bf',
            }}
          >
            −
          </button>
          <button
            onClick={() => onChange(Math.min(target, value + 1))}
            className="px-3 py-1 rounded-lg font-semibold"
            style={{
              background: 'rgba(45, 212, 191, 0.15)',
              color: '#2dd4bf',
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

// Step 3: Actions
function ActionsStep({ data, setData, onNext }: StepProps) {
  const ChipGroup = ({
    label,
    options,
    value,
    onChange,
  }: {
    label: string
    options: string[]
    value: string
    onChange: (val: string) => void
  }) => (
    <div className="space-y-3">
      <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <motion.button
            key={opt}
            onClick={() => onChange(opt)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: value === opt ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${value === opt ? 'rgba(45, 212, 191, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
              color: value === opt ? '#2dd4bf' : '#8892a4',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  )

  return (
    <motion.div
      // Container does not fade: with rAF paused this would stay at 0.
      initial={false}
      className="space-y-6 px-6 py-8"
    >
      <ChipGroup
        label="Nutrition Adherence"
        options={['Spot-on', 'Mostly', 'Partly', 'Off-track']}
        value={data.nutritionAdherence}
        onChange={(val) => setData({ ...data, nutritionAdherence: val })}
      />
      {/* The workout target is whatever the coach programmed her, so it is hers
          to set. Fixed at the seeded default, a client on four sessions a week
          could never record more than three. */}
      <Counter
        label="Workouts"
        value={data.workoutsCompleted}
        target={data.workoutsTarget}
        onChange={(val) => setData({ ...data, workoutsCompleted: val })}
        onTargetChange={(val) =>
          setData({ ...data, workoutsTarget: val, workoutsCompleted: Math.min(data.workoutsCompleted, val) })
        }
      />
      <Counter
        label="Medication"
        value={data.medsTaken}
        target={data.medsTarget}
        onChange={(val) => setData({ ...data, medsTaken: val })}
      />

      {/* Daily step average. The column existed and was charted on Progress,
          but nothing ever collected it — every row was null. */}
      <div className="space-y-3">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Average daily steps
        </label>
        <input
          value={data.steps ?? ''}
          onChange={(e) => {
            const v = e.target.value
            setData({ ...data, steps: v === '' ? undefined : Math.max(0, Math.round(Number(v) || 0)) })
          }}
          inputMode="numeric"
          placeholder="e.g. 6000 — leave blank if you don't track"
          className="w-full px-4 py-3 rounded-xl text-base tabular-nums focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8eaf0' }}
        />
      </div>

      <motion.button
        onClick={onNext}
        className="w-full py-4 rounded-full font-semibold text-base text-white mt-8"
        style={{
          background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
          boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
        }}
        whileHover={{ transform: 'translateY(-2px)' }}
        whileTap={{ scale: 0.98 }}
      >
        Next
      </motion.button>
    </motion.div>
  )
}

// Step: weight — starts at her last weight and moves by tap, so no keyboard.
function WeightStep({ data, setData, onNext, lastWeight }: StepProps & { lastWeight: number | null }) {
  const shown = typeof data.weight === 'number' ? data.weight : lastWeight
  const nudge = (d: number) => {
    const base = typeof data.weight === 'number' ? data.weight : lastWeight ?? 60
    const v = Math.round((base + d) * 10) / 10
    setData({ ...data, weight: Math.min(400, Math.max(25, v)) })
  }
  const btn = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eaf0' } as const
  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h2 className="text-[22px] font-semibold" style={{ color: '#e8eaf0' }}>This morning&apos;s weight</h2>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>After the toilet, before food. Tap to adjust.</p>
      </div>

      <div className="text-center py-2">
        <span className="tabular-nums" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 64, lineHeight: 1, color: typeof data.weight === 'number' ? '#e8eaf0' : '#5a6578' }}>
          {shown != null ? shown.toFixed(1) : '—'}
        </span>
        <span className="text-lg ml-1" style={{ color: '#8892a4' }}>kg</span>
        {typeof data.weight !== 'number' && lastWeight != null && (
          <p className="text-xs mt-2" style={{ color: '#5a6578' }}>Last time: {lastWeight.toFixed(1)} kg</p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[-1, -0.1, 0.1, 1].map((d) => (
          <button key={d} onClick={() => nudge(d)} className="h-14 rounded-2xl text-base font-semibold tabular-nums active:scale-[0.97]" style={btn}>
            {d > 0 ? '+' : '−'}{Math.abs(d)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        {typeof data.weight !== 'number' && lastWeight != null ? (
          <button onClick={() => { setData({ ...data, weight: lastWeight }); onNext() }} className="w-full h-14 rounded-full font-bold text-base" style={{ background: '#2dd4bf', color: '#06231f' }}>
            Same as last time · Next
          </button>
        ) : (
          <button onClick={onNext} disabled={typeof data.weight !== 'number'} className="w-full h-14 rounded-full font-bold text-base disabled:opacity-50" style={{ background: '#2dd4bf', color: '#06231f' }}>
            Next
          </button>
        )}
        <button onClick={() => { setData({ ...data, weight: undefined }); onNext() }} className="w-full h-11 text-sm" style={{ color: '#8892a4' }}>
          Didn&apos;t weigh this week
        </button>
      </div>
    </div>
  )
}


// Measurements — the proof that works when the scale refuses to move.
// Skippable: measuring every single week is unrealistic, and a client who
// feels nagged by it will abandon the whole check-in.
function MeasurementsStep({ data, setData, onNext }: StepProps) {
  const set = (key: string, raw: string) => {
    const v = raw === '' ? null : Number(raw)
    setData({ ...data, measurements: { ...data.measurements, [key]: v === null || Number.isNaN(v) ? null : v } })
  }
  const filled = SITES.filter((s) => typeof data.measurements[s.key] === 'number').length

  return (
    <motion.div
      // Container does not fade: with rAF paused this would stay at 0.
      initial={false}
      className="space-y-5 px-6 py-8"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Measurements (cm)
        </label>
        <p className="text-xs" style={{ color: '#5a6578' }}>
          Inches move when the scale won&rsquo;t. Fill in what you can — even one site tracked
          consistently tells the story.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {SITES.map((s) => (
          <div key={s.key} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <label className="block text-[12px] font-semibold" style={{ color: '#e8eaf0' }}>{s.label}</label>
            <p className="text-[9.5px] mb-1.5" style={{ color: '#5a6578', lineHeight: 1.3 }}>{s.hint}</p>
            <input
              value={data.measurements[s.key] ?? ''}
              onChange={(e) => set(s.key, e.target.value)}
              inputMode="decimal"
              placeholder="—"
              className="w-full px-2.5 py-2 rounded-lg text-sm tabular-nums focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8eaf0' }}
            />
          </div>
        ))}
      </div>

      <motion.button
        onClick={onNext}
        className="w-full py-4 rounded-full font-semibold text-base text-white mt-6"
        style={{
          background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
          boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
        }}
        whileHover={{ transform: 'translateY(-2px)' }}
        whileTap={{ scale: 0.98 }}
      >
        {filled > 0 ? `Next · ${filled} recorded` : 'Next'}
      </motion.button>
      {filled === 0 && (
        <button onClick={onNext} className="w-full text-center text-sm" style={{ color: '#5a6578' }}>
          Skip measurements this week
        </button>
      )}
    </motion.div>
  )
}

// Step 5: Thyroid symptoms — severity, not just presence. Scoring each symptom
// 0–3 every week is what lets Progress show "4 of 6 symptoms improved", the
// win that keeps a client engaged through a plateau on the scale.
function SymptomsStep({ data, setData, onNext }: StepProps) {
  const setSeverity = (symptom: string, value: number) => {
    setData({ ...data, symptoms: { ...data.symptoms, [symptom]: value } })
  }

  return (
    <motion.div
      // Container does not fade: with rAF paused this would stay at 0.
      initial={false}
      className="space-y-5 px-6 py-8"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          How were these this week?
        </label>
        <p className="text-xs" style={{ color: '#5a6578' }}>
          These often improve before the scale moves — tracking them shows your progress early.
        </p>
      </div>

      <div className="space-y-3">
        {SYMPTOMS.map((s) => {
          const current = data.symptoms[s.key]
          return (
            <div
              key={s.key}
              className="p-3.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-sm font-medium mb-2.5" style={{ color: '#e8eaf0' }}>{s.key}</p>
              <div className="flex gap-1.5">
                {SEVERITY_LABELS.map((label, level) => {
                  const active = current === level
                  return (
                    <button
                      key={label}
                      onClick={() => setSeverity(s.key, level)}
                      className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all"
                      style={{
                        background: active ? 'rgba(45,212,191,0.16)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(45,212,191,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        color: active ? '#2dd4bf' : '#7e8a9e',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <motion.button
        onClick={onNext}
        className="w-full py-4 rounded-full font-semibold text-base text-white mt-8"
        style={{
          background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
          boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
        }}
        whileHover={{ transform: 'translateY(-2px)' }}
        whileTap={{ scale: 0.98 }}
      >
        Next
      </motion.button>
    </motion.div>
  )
}

// Step: one optional line, then send.
function NoteStep({ data, setData, onSubmit, isLoading }: StepProps & { onSubmit: (data: CheckInData) => void; isLoading: boolean }) {
  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h2 className="text-[22px] font-semibold" style={{ color: '#e8eaf0' }}>Anything to tell your coach?</h2>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>Optional. A win, a struggle, a question.</p>
      </div>
      <input
        value={data.reflectionText}
        onChange={(e) => setData({ ...data, reflectionText: e.target.value })}
        placeholder="Skip if nothing comes to mind"
        maxLength={280}
        disabled={isLoading}
        className="w-full h-14 px-4 rounded-2xl text-base bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#5a6578] focus:outline-none focus:border-[#2dd4bf]"
      />
      <button
        onClick={() => onSubmit(data)}
        disabled={isLoading}
        className="w-full h-14 rounded-full font-bold text-base disabled:opacity-60"
        style={{ background: '#2dd4bf', color: '#06231f' }}
      >
        {isLoading ? 'Sending…' : 'Send check-in'}
      </button>
    </div>
  )
}


/** Mean of energy, sleep and inverted stress — three 1-10 scales, so 10 is the ceiling. */
const WEEK_SCORE_MAX = 10
/** Must track the <circle> geometry: the ring is drawn at r=72 inside a 160px box. */
const RING_RADIUS = 72
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function SubmissionRevealStep({ data, submissionData, error }: { data: CheckInData; submissionData: any; error: string | null }) {
  /**
   * The celebration cascade ran 0.2s -> 2.0s, so "Back to dashboard" did not
   * exist for the first two seconds after she pressed submit. She is finished
   * and wants out; the app was still performing at her. Halving every delay
   * keeps the choreography — same order, same proportions, same beats — and
   * gets her to the exit in one second instead of two.
   */
  const scale = useRevealScale(0.5)
  const reveal = (seconds: number) => seconds * scale
  if (error) {
    return (
      <motion.div
        // Container does not fade: with rAF paused this would stay at 0.
        initial={false}
        className="flex flex-col items-center justify-center h-full gap-6 px-6 py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239, 68, 68, 0.2)' }}
        >
          <AlertCircle size={32} style={{ color: '#ef4444' }} />
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-center"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontStyle: 'italic',
            color: '#e8eaf0',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reveal(0.1) }}
        >
          Submission Failed
        </motion.h2>

        <motion.p
          className="text-base text-center max-w-sm"
          style={{ color: '#ef4444' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reveal(0.15) }}
        >
          {error}
        </motion.p>

        <motion.button
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-full font-semibold"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reveal(0.2) }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      </motion.div>
    )
  }

  // Use real submission data if available, otherwise fallback to placeholder
  const weekScore = submissionData?.data?.weekScore ?? Math.round((data.energy + data.sleepQuality + (10 - data.stress)) / 3)
  // weekScore is the mean of three 1-10 scales, so it tops out at 10 — dividing
  // by 100 left the ring under a tenth full on her best possible week.
  const ringFraction = Math.min(1, Math.max(0, weekScore / WEEK_SCORE_MAX))
  const prevEnergy = submissionData?.data?.prevEnergy ?? null
  const prevSleep = submissionData?.data?.prevSleep ?? null
  const prevWeight = submissionData?.data?.prevWeight ?? null
  const energyDelta = submissionData?.data?.energyDelta ?? (prevEnergy !== null ? data.energy - prevEnergy : 0)
  const sleepDelta = submissionData?.data?.sleepDelta ?? (prevSleep !== null ? data.sleepQuality - prevSleep : 0)
  const weightDelta = submissionData?.data?.weightDelta ?? (prevWeight !== null && data.weight !== undefined ? prevWeight - data.weight : null)
  
  // Highlight ONE win
  const medsAdherence = data.medsTarget > 0 ? (data.medsTaken / data.medsTarget) * 100 : 0
  const workoutAdherence = data.workoutsTarget > 0 ? (data.workoutsCompleted / data.workoutsTarget) * 100 : 0
  
  const getHighlight = () => {
    if (medsAdherence > 85) {
      return {
        title: `You took your meds ${data.medsTaken} of ${data.medsTarget} days`,
        subtitle: 'Your best week yet',
        emoji: '💊',
      }
    }
    if (workoutAdherence > 80) {
      return {
        title: `You completed ${data.workoutsCompleted} of ${data.workoutsTarget} workouts`,
        subtitle: 'Incredible consistency',
        emoji: '🏃',
      }
    }
    if (data.mood >= 4) {
      return {
        title: 'You maintained a positive mood all week',
        subtitle: 'Emotional resilience is strength',
        emoji: '✨',
      }
    }
    return {
      title: 'You showed up for yourself',
      subtitle: 'Every check-in is progress',
      emoji: '🌱',
    }
  }
  
  const highlight = getHighlight()
  
  return (
    <motion.div
      // Container does not fade: with rAF paused this would stay at 0.
      initial={false}
      className="flex flex-col items-center justify-start h-full gap-8 px-6 py-8 pb-safe"
    >
      {/* Animated Ring Counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15, delay: reveal(0.2) }}
        className="relative w-40 h-40 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(45, 212, 191, 0.1) 0%, transparent 70%)',
          boxShadow: '0 0 60px rgba(45, 212, 191, 0.15)',
        }}
      >
        {/* Inner ring background */}
        <div className="absolute inset-0 rounded-full" style={{ 
          background: 'rgba(255, 255, 255, 0.03)',
          border: '2px solid rgba(45, 212, 191, 0.2)',
        }} />
        
        {/* Animated SVG ring */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* motion.circle, not circle-with-an-`as`-prop: framer only animates its
              own elements, so the offset never moved off its full value and the
              ring — the payoff for nine screens — was always empty. */}
          <motion.circle
            cx="80"
            cy="80"
            r={RING_RADIUS}
            stroke="url(#gradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.3))',
            }}
            strokeDasharray={RING_CIRCUMFERENCE}
            initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
            animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - ringFraction) }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content with counter */}
        <motion.div
          className="flex flex-col items-center gap-2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reveal(0.8) }}
        >
          <motion.div
            className="text-5xl font-bold"
            style={{ color: '#2dd4bf' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, delay: reveal(1.2) }}
          >
            {weekScore}
          </motion.div>
          <div className="text-xs uppercase font-medium" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
            This Week
          </div>
        </motion.div>
      </motion.div>

      {/* This Week vs Last Week Deltas */}
      <motion.div
        className="w-full max-w-sm space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reveal(1.4) }}
      >
        <div className="text-xs uppercase font-medium" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Week Over Week
        </div>
        
        {/* Energy Delta */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
          <span style={{ color: '#e8eaf0' }}>Energy</span>
          <div className="flex items-center gap-2">
            <span style={{ color: '#2dd4bf', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {data.energy}
            </span>
            {energyDelta !== 0 && (
              <div className="flex items-center gap-1" style={{ color: deltaTone(energyDelta, 'up').color }}>
                {energyDelta > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                <span className="text-xs font-semibold">{Math.abs(energyDelta)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sleep Delta */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
          <span style={{ color: '#e8eaf0' }}>Sleep Quality</span>
          <div className="flex items-center gap-2">
            <span style={{ color: '#2dd4bf', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {data.sleepQuality}
            </span>
            {sleepDelta !== 0 && (
              <div className="flex items-center gap-1" style={{ color: deltaTone(sleepDelta, 'up').color }}>
                {sleepDelta > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                <span className="text-xs font-semibold">{Math.abs(sleepDelta)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Weight Delta */}
        {data.weight !== undefined && (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
            <span style={{ color: '#e8eaf0' }}>Weight</span>
            <div className="flex items-center gap-2">
              <span style={{ color: '#2dd4bf', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {data.weight.toFixed(1)} kg
              </span>
              {weightDelta !== null && weightDelta !== 0 && (
                <div className="flex items-center gap-1" style={{ color: deltaTone(weightDelta, 'down').color }}>
                  {weightDelta < 0 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                  <span className="text-xs font-semibold">{Math.abs(weightDelta).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Highlight WIN */}
      <motion.div
        className="w-full max-w-sm p-4 rounded-xl border"
        style={{
          background: 'rgba(45, 212, 191, 0.08)',
          border: '1px solid rgba(45, 212, 191, 0.25)',
          boxShadow: '0 0 32px rgba(45, 212, 191, 0.1)',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reveal(1.6) }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{highlight.emoji}</span>
          <Award size={18} style={{ color: '#2dd4bf' }} />
        </div>
        <p className="font-semibold" style={{ color: '#e8eaf0' }}>
          {highlight.title}
        </p>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>
          {highlight.subtitle}
        </p>
      </motion.div>

      {/* Reassurance Line */}
      <motion.div
        className="text-center space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reveal(1.8) }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#8892a4' }}>
          Your coach will review this and reply
        </p>
        <p className="text-sm font-medium" style={{ color: '#8892a4' }}>
          within 24 hours.
        </p>
      </motion.div>

      {/* Back to Dashboard + Photos Options */}
      <motion.div
        className="w-full max-w-sm mt-8 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reveal(2) }}
      >
        <motion.button
          onClick={() => window.location.href = '/dashboard/check-in/photos'}
          className="w-full py-4 rounded-full font-semibold text-base text-white"
          style={{
            background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
            boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
          }}
          whileHover={{ transform: 'translateY(-2px)', boxShadow: '0 0 48px rgba(45, 212, 191, 0.4)' }}
          whileTap={{ scale: 0.98 }}
        >
          Add Progress Photos (Optional)
        </motion.button>
        <motion.button
          onClick={() => window.location.href = '/dashboard'}
          className="w-full py-4 rounded-full font-semibold text-base"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#8892a4',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Dashboard
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
// Main component

/** A saved check-in for the current week, as stored. */
export interface ExistingCheckIn {
  energy_level?: number | null
  mood?: number | null
  sleep_quality?: number | null
  stress_level?: number | null
  digestion_score?: number | null
  bloating?: number | null
  cravings?: number | null
  adherence_score?: number | null
  workouts_completed?: number | null
  workouts_target?: number | null
  meds_taken?: number | null
  meds_target?: number | null
  weight?: number | null
  steps?: number | null
  neck?: number | null
  chest?: number | null
  waist?: number | null
  hips?: number | null
  arm?: number | null
  thigh?: number | null
  calf?: number | null
  symptoms?: unknown
  reflection_text?: string | null
}

/** Only real numbers survive; nulls stay absent so an untouched site is not zero. */
function seedMeasurements(e: ExistingCheckIn | null): Measurements {
  if (!e) return {}
  const out: Measurements = {}
  for (const s of SITES) {
    const v = e[s.key as keyof ExistingCheckIn]
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[s.key] = v
  }
  return out
}

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback
const has = (v: unknown) => v !== null && v !== undefined

type StepKey = 'weight' | 'feel' | 'measurements' | 'stress' | 'body' | 'actions' | 'symptoms' | 'note' | 'completion'

const STEP_TITLES: Record<StepKey, string> = {
  weight: 'Weight', feel: 'How the week felt', measurements: 'Monthly measurements', stress: 'Stress',
  body: 'Digestion', actions: 'Habits', symptoms: 'Symptoms', note: 'A note for your coach', completion: '',
}

/**
 * The steps, in order. Built from the list — nothing indexes into it by number,
 * because a hardcoded index is how this project once silently dropped the last
 * answer when a question was added.
 *
 *  - default: weight → how the week felt → optional note (three steps)
 *  - first 7 days of a month: measurements before the note
 *  - "add more detail": stress, digestion, habits and symptoms before the note
 */
function stepKeys(detail: boolean, monthly: boolean): StepKey[] {
  return [
    'weight', 'feel',
    ...(monthly ? (['measurements'] as StepKey[]) : []),
    ...(detail ? (['stress', 'body', 'actions', 'symptoms'] as StepKey[]) : []),
    'note', 'completion',
  ]
}

/** Which answers each detail step commits when she moves past it. */
const COMMITS: Partial<Record<StepKey, string[]>> = {
  body: ['digestion', 'bloating', 'cravings'],
  actions: ['nutritionAdherence', 'workouts', 'meds'],
}

const DRAFT_KEY = 'thyrowell.checkin.draft.v2'

export function WeeklyCheckInFlow({ existing = null, lastWeight = null }: { existing?: ExistingCheckIn | null; lastWeight?: number | null }) {
  const monthly = new Date().getDate() <= 7
  const [detail, setDetail] = useState(false)
  const [stepKey, setStepKey] = useState<StepKey>('weight')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionData, setSubmissionData] = useState<any>(null)
  // False until the draft has been read. Saving before then would write the
  // blank starting state over the very draft that is about to be restored.
  const [restored, setRestored] = useState(false)
  const [data, setData] = useState<CheckInData>(() => ({
    energy: num(existing?.energy_level, 5),
    mood: num(existing?.mood, 3),
    sleepQuality: num(existing?.sleep_quality, 6),
    stress: num(existing?.stress_level, 5),
    digestion: toLabel(DIGESTION, existing?.digestion_score, 'Okay'),
    bloating: toLabel(BLOATING, existing?.bloating, 'Mild'),
    cravings: toLabel(CRAVINGS, existing?.cravings, 'Manageable'),
    nutritionAdherence: toLabel(ADHERENCE, existing?.adherence_score, 'Mostly'),
    workoutsCompleted: num(existing?.workouts_completed, 0),
    workoutsTarget: num(existing?.workouts_target, 3),
    medsTaken: num(existing?.meds_taken, 0),
    medsTarget: num(existing?.meds_target, 7),
    weight: typeof existing?.weight === 'number' ? existing.weight : undefined,
    steps: typeof existing?.steps === 'number' ? existing.steps : undefined,
    measurements: seedMeasurements(existing),
    symptoms: parseSymptoms(existing?.symptoms) ?? {},
    reflectionText: existing?.reflection_text || '',
    // Anything already saved this week counts as answered.
    touched: [
      has(existing?.energy_level) && 'energy', has(existing?.sleep_quality) && 'sleepQuality', has(existing?.mood) && 'mood',
      has(existing?.stress_level) && 'stress', has(existing?.digestion_score) && 'digestion', has(existing?.bloating) && 'bloating',
      has(existing?.cravings) && 'cravings', has(existing?.adherence_score) && 'nutritionAdherence',
      has(existing?.workouts_completed) && 'workouts', has(existing?.meds_taken) && 'meds',
    ].filter(Boolean) as string[],
  }))

  const keys = stepKeys(detail, monthly)
  const index = Math.max(0, keys.indexOf(stepKey))
  const questionCount = keys.length - 1

  // Resume a draft: same answers, same step, same path. On Android a call, the
  // back button or the WebView reclaiming memory used to take every answer with
  // it; now a killed app reopens on the step she was on.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return setRestored(true)
      const saved = JSON.parse(raw) as { savedAt: number; stepKey: StepKey; detail: boolean; data: CheckInData }
      if (!saved?.data || Date.now() - saved.savedAt > 7 * 86400000) {
        window.localStorage.removeItem(DRAFT_KEY)
        return setRestored(true)
      }
      // Merge over the defaults so a draft written by an older build can never
      // leave a key missing that a step reads directly.
      setData((current) => ({
        ...current,
        ...saved.data,
        measurements: { ...current.measurements, ...(saved.data.measurements ?? {}) },
        symptoms: { ...current.symptoms, ...(saved.data.symptoms ?? {}) },
        touched: Array.isArray(saved.data.touched) ? saved.data.touched : current.touched,
      }))
      setDetail(Boolean(saved.detail))
      if (saved.stepKey && saved.stepKey !== 'completion' && stepKeys(Boolean(saved.detail), monthly).includes(saved.stepKey)) {
        setStepKey(saved.stepKey)
      }
    } catch {
      try { window.localStorage.removeItem(DRAFT_KEY) } catch {}
    }
    setRestored(true)
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Saved on every answer and every step change — not only at the end.
  useEffect(() => {
    if (!restored || stepKey === 'completion') return
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), stepKey, detail, data }))
    } catch {}
  }, [data, stepKey, detail, restored])

  const goNext = (from: StepKey = stepKey, withDetail = detail) => {
    const commit = COMMITS[from]
    if (commit) setData((d) => ({ ...d, touched: Array.from(new Set([...d.touched, ...commit])) }))
    const list = stepKeys(withDetail, monthly)
    const i = list.indexOf(from)
    setStepKey(list[Math.min(i + 1, list.length - 1)])
  }
  const goBack = () => setStepKey(keys[Math.max(0, index - 1)])

  const handleSubmitCheckIn = async (checkInData: CheckInData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    const t = (k: string) => checkInData.touched.includes(k)
    try {
      // A question she was not asked is sent as blank, never as a made-up middle value.
      const result = await submitWeeklyCheckIn({
        ...checkInData,
        energy: t('energy') ? checkInData.energy : null,
        sleepQuality: t('sleepQuality') ? checkInData.sleepQuality : null,
        mood: t('mood') ? checkInData.mood : null,
        stress: t('stress') ? checkInData.stress : null,
        digestion: t('digestion') ? checkInData.digestion : null,
        bloating: t('bloating') ? checkInData.bloating : null,
        cravings: t('cravings') ? checkInData.cravings : null,
        nutritionAdherence: t('nutritionAdherence') ? checkInData.nutritionAdherence : null,
        workoutsCompleted: t('workouts') ? checkInData.workoutsCompleted : null,
        workoutsTarget: t('workouts') ? checkInData.workoutsTarget : null,
        medsTaken: t('meds') ? checkInData.medsTaken : null,
        medsTarget: t('meds') ? checkInData.medsTarget : null,
      })
      if (!result.success) {
        // Show the failure screen; the draft is kept, so "Try again" resumes.
        setSubmitError(result.error || 'Failed to submit check-in')
        setStepKey('completion')
        return
      }
      setSubmissionData(result)
      try { window.localStorage.removeItem(DRAFT_KEY) } catch {}
      setStepKey('completion')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setStepKey('completion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepProps = { data, setData, onNext: () => goNext() }
  const body: Record<StepKey, React.ReactNode> = {
    weight: <WeightStep {...stepProps} lastWeight={lastWeight} />,
    feel: <FeelStep {...stepProps} onMore={() => { setDetail(true); goNext('feel', true) }} />,
    measurements: <MeasurementsStep {...stepProps} />,
    stress: <StressStep {...stepProps} />,
    body: <BodyStep {...stepProps} />,
    actions: <ActionsStep {...stepProps} />,
    symptoms: <SymptomsStep {...stepProps} />,
    note: <NoteStep {...stepProps} onSubmit={handleSubmitCheckIn} isLoading={isSubmitting} />,
    completion: <SubmissionRevealStep data={data} submissionData={submissionData} error={submitError} />,
  }

  return (
    <div className="min-h-screen w-full" style={{ background: '#090c14' }}>
      {stepKey !== 'completion' && (
        <div className="sticky top-0 z-40 px-4 pt-4 pb-3" style={{ background: 'rgba(9,12,20,0.92)' }}>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <button onClick={goBack} className="p-2 rounded-lg" aria-label="Back" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <ChevronLeft size={22} style={{ color: '#8892a4' }} />
              </button>
            ) : (
              <a href="/dashboard" className="p-2 rounded-lg" aria-label="Close" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <ChevronLeft size={22} style={{ color: '#8892a4' }} />
              </a>
            )}
            <p className="flex-1 text-center text-[11px] uppercase font-semibold" style={{ color: '#7e8a9e', letterSpacing: '0.14em' }}>
              Step {index + 1} of {questionCount} · {STEP_TITLES[stepKey]}
            </p>
            <span className="w-[38px]" />
          </div>
          <div className="flex gap-1.5 mt-3">
            {keys.slice(0, -1).map((k, i) => (
              <span key={k} className="h-1 rounded-full flex-1" style={{ background: i <= index ? '#2dd4bf' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>
      )}

      {/* Rendered directly, with no AnimatePresence: the Android WebView pauses
          requestAnimationFrame, an exit animation never finishes, and the flow
          freezes. The step swap is instant and depends on no animation frame. */}
      <div className="pb-safe">{body[stepKey]}</div>
    </div>
  )
}
