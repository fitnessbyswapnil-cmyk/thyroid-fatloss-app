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
}

// Step components
interface StepProps {
  data: CheckInData
  setData: (data: CheckInData) => void
  onNext: () => void
}

// Step 0: Prime - Welcome screen
function PrimeStep({ onNext }: { onNext: () => void }) {
  // Scale 1: this intro beat is deliberate and stays as designed. Routing it
  // through reveal() only so it collapses to nothing under reduced motion.
  const scale = useRevealScale(1)
  const reveal = (seconds: number) => seconds * scale

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full gap-8 px-6 py-12"
    >
      <div className="space-y-6 text-center max-w-sm">
        <motion.h2
          className="text-4xl font-bold"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontStyle: 'italic',
            color: '#e8eaf0',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reveal(0.2), duration: 0.6 }}
        >
          This is your time.
        </motion.h2>
        <motion.p
          className="text-lg leading-relaxed"
          style={{ color: '#8892a4' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reveal(0.4), duration: 0.6 }}
        >
          Let&apos;s see how far you&apos;ve come.
        </motion.p>
      </div>

      <motion.button
        onClick={onNext}
        className="w-full max-w-xs py-4 rounded-full font-semibold text-base text-white"
        style={{
          background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
          boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reveal(0.6), duration: 0.6 }}
        whileHover={{ transform: 'translateY(-2px)', boxShadow: '0 0 48px rgba(45, 212, 191, 0.4)' }}
        whileTap={{ transform: 'scale(0.98)' }}
      >
        Begin
      </motion.button>
    </motion.div>
  )
}

// Step 1: Feelings
function FeelingsStep({ data, setData, onNext }: StepProps) {
  const moodFaces = [
    { value: 1, icon: Frown, label: 'Struggling' },
    { value: 2, icon: Frown, label: 'Okay' },
    { value: 3, icon: Meh, label: 'Neutral' },
    { value: 4, icon: Smile, label: 'Good' },
    { value: 5, icon: Smile, label: 'Excellent' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 px-6 py-8"
    >
      {/* Energy Slider */}
      <div className="space-y-3">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Energy Level
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: '#5a6578', minWidth: '60px' }}>
            Drained
          </span>
          <input
            type="range"
            min="1"
            max="10"
            value={data.energy}
            onChange={(e) => setData({ ...data, energy: parseInt(e.target.value) })}
            className="flex-1 h-2 rounded-full appearance-none bg-gradient-to-r from-[#1c2438] to-[#1c2438] cursor-pointer"
            style={{
              background: `linear-gradient(to right, #2dd4bf 0%, #2dd4bf ${(data.energy / 10) * 100}%, #1c2438 ${(data.energy / 10) * 100}%, #1c2438 100%)`,
            }}
          />
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#2dd4bf', minWidth: '40px' }}>
            {data.energy}
          </span>
        </div>
        <p className="text-xs" style={{ color: '#5a6578' }}>
          How energized do you feel today?
        </p>
      </div>

      {/* Mood - Emoji faces */}
      <div className="space-y-3">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Mood
        </label>
        <div className="flex justify-between gap-2">
          {moodFaces.map((face, idx) => {
            const Icon = face.icon
            return (
              <motion.button
                key={face.value}
                onClick={() => setData({ ...data, mood: face.value })}
                className="flex-1 p-3 rounded-xl transition-all"
                style={{
                  background: data.mood === face.value ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${data.mood === face.value ? 'rgba(45, 212, 191, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  size={28}
                  style={{ margin: '0 auto', color: data.mood === face.value ? '#2dd4bf' : '#8892a4' }}
                />
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Sleep Quality Slider */}
      <div className="space-y-3">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Sleep Quality
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: '#5a6578', minWidth: '60px' }}>
            Poor
          </span>
          <input
            type="range"
            min="1"
            max="10"
            value={data.sleepQuality}
            onChange={(e) => setData({ ...data, sleepQuality: parseInt(e.target.value) })}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #2dd4bf 0%, #2dd4bf ${(data.sleepQuality / 10) * 100}%, #1c2438 ${(data.sleepQuality / 10) * 100}%, #1c2438 100%)`,
            }}
          />
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#2dd4bf', minWidth: '40px' }}>
            {data.sleepQuality}
          </span>
        </div>
      </div>

      {/* Stress Slider */}
      <div className="space-y-3">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Stress Level
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: '#5a6578', minWidth: '60px' }}>
            Relaxed
          </span>
          <input
            type="range"
            min="1"
            max="10"
            value={data.stress}
            onChange={(e) => setData({ ...data, stress: parseInt(e.target.value) })}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #34d399 0%, #34d399 ${((data.stress - 1) / 9) * 100}%, rgba(255,255,255,0.08) ${((data.stress - 1) / 9) * 100}%, rgba(255,255,255,0.08) 100%)`,
            }}
          />
          <span className="text-sm font-semibold tabular-nums" style={{ color: levelTone(data.stress, 6), minWidth: '40px' }}>
            {data.stress}
          </span>
        </div>
        <p className="text-xs" style={{ color: '#5a6578' }}>
          However this week went, recording it honestly is what makes it useful.
        </p>
      </div>

      {/* Next Button */}
      <motion.button
        onClick={onNext}
        className="w-full py-4 rounded-full font-semibold text-base text-white mt-8"
        style={{
          background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
          boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
        }}
        whileHover={{ transform: 'translateY(-2px)', boxShadow: '0 0 48px rgba(45, 212, 191, 0.4)' }}
        whileTap={{ scale: 0.98 }}
      >
        Continue
      </motion.button>
    </motion.div>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        Continue
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        Continue
      </motion.button>
    </motion.div>
  )
}

// Step 4: Weight (Skippable)
function WeightStep({ data, setData, onNext }: StepProps) {
  const handleSkip = () => {
    setData({ ...data, weight: undefined })
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 px-6 py-8"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Current Weight (kg)
        </label>
        <input
          type="number"
          step="0.1"
          value={data.weight || ''}
          onChange={(e) => setData({ ...data, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="e.g. 72.5"
          className="w-full px-4 py-3 rounded-xl text-base font-semibold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#5a6578] focus:outline-none focus:border-[#2dd4bf]"
        />
      </div>

      <p className="text-sm leading-relaxed" style={{ color: '#8892a4' }}>
        One signal among many. Bodies fluctuate — especially thyroid bodies.
      </p>

      <div className="flex flex-col gap-3 pt-4">
        <motion.button
          onClick={onNext}
          className="w-full py-4 rounded-full font-semibold text-base text-white"
          style={{
            background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
            boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
          }}
          whileHover={{ transform: 'translateY(-2px)' }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
        <motion.button
          onClick={handleSkip}
          className="w-full py-4 rounded-full font-semibold text-base"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#8892a4',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Skip for now
        </motion.button>
      </div>
    </motion.div>
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
        {filled > 0 ? `Continue with ${filled} recorded` : 'Continue'}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        Continue
      </motion.button>
    </motion.div>
  )
}

// Step 6: Reflection
function ReflectionStep({ data, setData, onNext, onSubmit, isLoading }: StepProps & { onSubmit: (data: CheckInData) => void; isLoading: boolean }) {
  const handleSubmit = async () => {
    await onSubmit(data)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 px-6 py-8"
    >
      <div className="space-y-3">
        <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
          Your Reflection
        </label>
        <textarea
          value={data.reflectionText}
          onChange={(e) => setData({ ...data, reflectionText: e.target.value })}
          placeholder="One win this week? Anything you're struggling with?"
          className="w-full px-4 py-3 rounded-xl text-base bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#5a6578] focus:outline-none focus:border-[#2dd4bf] min-h-[120px] resize-none"
          disabled={isLoading}
        />
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-4 rounded-full font-semibold text-base text-white disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
          boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
        }}
        whileHover={!isLoading ? { transform: 'translateY(-2px)' } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
      >
        {isLoading ? 'Submitting...' : 'Complete Check-In'}
      </motion.button>
    </motion.div>
  )
}

// Submission Reveal Screen - Animated metrics and celebration

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
/**
 * Ordered step keys — the single source of truth for how long the flow is and
 * where the end sits. Everything (progress dots, back button, submit) derives
 * from this, so adding a step here is the only change required.
 */
const STEP_KEYS = [
  'prime', 'feelings', 'body', 'actions', 'weight',
  'measurements', 'symptoms', 'reflection', 'completion',
] as const
const COMPLETION_STEP = STEP_KEYS.length - 1

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

export function WeeklyCheckInFlow({ existing = null }: { existing?: ExistingCheckIn | null }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionData, setSubmissionData] = useState<any>(null)
  const [data, setData] = useState<CheckInData>({
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
  })

  // Hold the draft locally between renders.
  //
  // This is nine screens on a phone, and on Android a hardware back tap, a call,
  // or the browser reclaiming memory took every answer with it. She then has to
  // decide whether to start again — which, on the week she is least motivated,
  // she often will not.
  //
  // Keyed by programme-week storage key so last week's draft cannot resurface.
  const DRAFT_KEY = "thyrowell.checkin.draft"

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { savedAt: number; step: number; data: CheckInData }
      // A draft older than a week belongs to a check-in she has since submitted.
      if (!saved?.data || Date.now() - saved.savedAt > 7 * 86400000) {
        window.localStorage.removeItem(DRAFT_KEY)
        return
      }
      setData(saved.data)
      if (typeof saved.step === "number" && saved.step > 0 && saved.step < COMPLETION_STEP) {
        setCurrentStep(saved.step)
      }
    } catch {
      // A corrupt draft must never block the check-in itself.
      try { window.localStorage.removeItem(DRAFT_KEY) } catch {}
    }
    // Intentionally once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (currentStep === 0 || currentStep >= COMPLETION_STEP) return
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), step: currentStep, data }))
    } catch {
      // Private mode or a full quota — losing the draft is bad, but failing the
      // check-in over it would be worse.
    }
  }, [data, currentStep])

  const handleSubmitCheckIn = async (checkInData: CheckInData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const result = await submitWeeklyCheckIn(checkInData)
      
      if (!result.success) {
        // Advance anyway. The completion step renders a proper "Submission
        // Failed" screen with a retry when it has an error, but the step advance
        // used to live only in the success branch — so after eight screens of
        // questions a failure just flipped the button back to "Complete
        // Check-In" and she reasonably assumed it had saved.
        setSubmitError(result.error || 'Failed to submit check-in')
        setCurrentStep(COMPLETION_STEP)
        return
      }
      
      setSubmissionData(result)
      // Saved for real — the draft has done its job.
      try { window.localStorage.removeItem(DRAFT_KEY) } catch {}
      setCurrentStep(COMPLETION_STEP)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setCurrentStep(COMPLETION_STEP)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Every step advances to "the next one" rather than a hardcoded number.
  // A hardcoded index derived from this list is exactly how a previous bug in
  // this project silently dropped the last answer when a question was added.
  const next = () => setCurrentStep((s) => Math.min(s + 1, COMPLETION_STEP))

  const steps = [
    <PrimeStep key="prime" onNext={next} />,
    <FeelingsStep key="feelings" data={data} setData={setData} onNext={next} />,
    <BodyStep key="body" data={data} setData={setData} onNext={next} />,
    <ActionsStep key="actions" data={data} setData={setData} onNext={next} />,
    <WeightStep key="weight" data={data} setData={setData} onNext={next} />,
    <MeasurementsStep key="measurements" data={data} setData={setData} onNext={next} />,
    <SymptomsStep key="symptoms" data={data} setData={setData} onNext={next} />,
    <ReflectionStep
      key="reflection"
      data={data}
      setData={setData}
      onNext={next}
      onSubmit={handleSubmitCheckIn}
      isLoading={isSubmitting}
    />,
    <SubmissionRevealStep key="completion" data={data} submissionData={submissionData} error={submitError} />,
  ]

  return (
    <div className="min-h-screen w-full" style={{ background: '#090c14' }}>
      {/* Progress dots at top */}
      <div className="flex justify-center gap-1.5 px-6 py-6 sticky top-0 z-40">
        {[...Array(COMPLETION_STEP)].map((_, idx) => (
          <motion.div
            key={idx}
            className="h-1 rounded-full"
            style={{
              width: idx < currentStep ? 24 : 6,
              background: idx < currentStep ? '#2dd4bf' : 'rgba(255, 255, 255, 0.1)',
            }}
            initial={{ width: 6 }}
            animate={{ width: idx < currentStep ? 24 : 6 }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>

      {/* Back button */}
      {currentStep > 0 && currentStep < COMPLETION_STEP && (
        <motion.button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          className="absolute top-8 left-6 p-2 rounded-lg"
          style={{ background: 'rgba(255, 255, 255, 0.04)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ background: 'rgba(255, 255, 255, 0.08)' }}
        >
          <ChevronLeft size={24} style={{ color: '#8892a4' }} />
        </motion.button>
      )}

      {/* Step content */}
      <div className="pb-safe min-h-[calc(100vh-120px)]">
        {/* No mode="wait" here, deliberately.
            "wait" holds the next step until the previous one's exit animation
            reports finished. Framer-motion drives that from requestAnimationFrame,
            and inside the Android WebView shell rAF is throttled or paused
            whenever the view loses focus — a notification, a call, the keyboard
            opening, the screen locking mid-answer. When that happens the exit
            never completes, the next step is never mounted, and the flow is
            stuck on a frozen screen with a Next button that does nothing.
            Reported from a real phone, on the screen a client is least likely
            to retry. Cross-fading costs one frame of overlap and cannot wedge. */}
        <AnimatePresence>{steps[currentStep]}</AnimatePresence>
      </div>
    </div>
  )
}
