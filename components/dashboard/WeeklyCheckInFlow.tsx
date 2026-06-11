'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
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
  symptoms: string[]
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
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          This is your time.
        </motion.h2>
        <motion.p
          className="text-lg leading-relaxed"
          style={{ color: '#8892a4' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
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
        transition={{ delay: 0.6, duration: 0.6 }}
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
              background: `linear-gradient(to right, #34d399 0%, #34d399 ${(10 - data.stress / 10) * 100}%, #ef4444 ${(10 - data.stress / 10) * 100}%, #ef4444 100%)`,
            }}
          />
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#ef4444', minWidth: '40px' }}>
            {data.stress}
          </span>
        </div>
        <p className="text-xs" style={{ color: '#5a6578' }}>
          Supportive microcopy: Stress is temporary. You're doing great.
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

// Step 3: Actions
function ActionsStep({ data, setData, onNext }: StepProps) {
  const Counter = ({
    label,
    value,
    target,
    onChange,
  }: {
    label: string
    value: number
    target: number
    onChange: (val: number) => void
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium uppercase" style={{ color: '#8892a4', letterSpacing: '0.08em' }}>
        {label}
      </label>
      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
        <span style={{ color: '#8892a4' }}>
          {value} of {target}
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
      <Counter
        label="Workouts"
        value={data.workoutsCompleted}
        target={data.workoutsTarget}
        onChange={(val) => setData({ ...data, workoutsCompleted: val })}
      />
      <Counter
        label="Medication"
        value={data.medsTaken}
        target={data.medsTarget}
        onChange={(val) => setData({ ...data, medsTaken: val })}
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

// Step 5: Symptoms (Optional multi-select)
function SymptomsStep({ data, setData, onNext }: StepProps) {
  const symptomOptions = [
    'Cold sensitivity',
    'Hair thinning',
    'Brain fog',
    'Palpitations',
    'Joint aches',
    'Dry skin',
  ]

  const toggleSymptom = (symptom: string) => {
    const newSymptoms = data.symptoms.includes(symptom)
      ? data.symptoms.filter((s) => s !== symptom)
      : [...data.symptoms, symptom]
    setData({ ...data, symptoms: newSymptoms })
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
          Any Symptoms This Week? (Optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {symptomOptions.map((symptom) => (
            <motion.button
              key={symptom}
              onClick={() => toggleSymptom(symptom)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: data.symptoms.includes(symptom) ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${data.symptoms.includes(symptom) ? 'rgba(45, 212, 191, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: data.symptoms.includes(symptom) ? '#2dd4bf' : '#8892a4',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {symptom}
            </motion.button>
          ))}
        </div>
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
function SubmissionRevealStep({ data, submissionData, error }: { data: CheckInData; submissionData: any; error: string | null }) {
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
          transition={{ delay: 0.2 }}
        >
          Submission Failed
        </motion.h2>

        <motion.p
          className="text-base text-center max-w-sm"
          style={{ color: '#ef4444' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
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
          transition={{ delay: 0.6 }}
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
        transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
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
          <circle
            cx="80"
            cy="80"
            r="72"
            stroke="url(#gradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.3))',
            }}
            as={motion.circle}
            strokeDasharray="565"
            strokeDashoffset="565"
            initial={{ strokeDashoffset: 565 }}
            animate={{ strokeDashoffset: 565 - (weekScore / 100) * 565 }}
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
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="text-5xl font-bold"
            style={{ color: '#2dd4bf' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, delay: 1.2 }}
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
        transition={{ delay: 1.4 }}
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
              <div className="flex items-center gap-1" style={{ color: energyDelta > 0 ? '#34d399' : '#ef4444' }}>
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
              <div className="flex items-center gap-1" style={{ color: sleepDelta > 0 ? '#34d399' : '#ef4444' }}>
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
                <div className="flex items-center gap-1" style={{ color: weightDelta < 0 ? '#34d399' : '#ef4444' }}>
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
        transition={{ delay: 1.6 }}
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
        transition={{ delay: 1.8 }}
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
        transition={{ delay: 2 }}
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
export function WeeklyCheckInFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionData, setSubmissionData] = useState<any>(null)
  const [data, setData] = useState<CheckInData>({
    energy: 5,
    mood: 3,
    sleepQuality: 6,
    stress: 5,
    digestion: 'Okay',
    bloating: 'Mild',
    cravings: 'Manageable',
    nutritionAdherence: 'Mostly',
    workoutsCompleted: 0,
    workoutsTarget: 3,
    medsTaken: 0,
    medsTarget: 7,
    symptoms: [],
    reflectionText: '',
  })

  const handleSubmitCheckIn = async (checkInData: CheckInData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const result = await submitWeeklyCheckIn(checkInData)
      
      if (!result.success) {
        setSubmitError(result.error || 'Failed to submit check-in')
        return
      }
      
      setSubmissionData(result)
      setCurrentStep(7)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    <PrimeStep key="prime" onNext={() => setCurrentStep(1)} />,
    <FeelingsStep key="feelings" data={data} setData={setData} onNext={() => setCurrentStep(2)} />,
    <BodyStep key="body" data={data} setData={setData} onNext={() => setCurrentStep(3)} />,
    <ActionsStep key="actions" data={data} setData={setData} onNext={() => setCurrentStep(4)} />,
    <WeightStep key="weight" data={data} setData={setData} onNext={() => setCurrentStep(5)} />,
    <SymptomsStep key="symptoms" data={data} setData={setData} onNext={() => setCurrentStep(6)} />,
    <ReflectionStep 
      key="reflection" 
      data={data} 
      setData={setData} 
      onNext={() => setCurrentStep(7)}
      onSubmit={handleSubmitCheckIn}
      isLoading={isSubmitting}
    />,
    <SubmissionRevealStep key="completion" data={data} submissionData={submissionData} error={submitError} />,
  ]

  return (
    <div className="min-h-screen w-full" style={{ background: '#090c14' }}>
      {/* Progress dots at top */}
      <div className="flex justify-center gap-1.5 px-6 py-6 sticky top-0 z-40">
        {[...Array(7)].map((_, idx) => (
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
      {currentStep > 0 && currentStep < 7 && (
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
        <AnimatePresence mode="wait">{steps[currentStep]}</AnimatePresence>
      </div>
    </div>
  )
}
