'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Camera, Check, ChevronRight, FlaskConical, BookOpen, MessageSquare, Pill, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { BottomNavPill } from '@/components/dashboard/BottomNavPill'

export interface Week0Status {
  hasPlan: boolean
  hasLabs: boolean
  hasMedication: boolean
  hasMessaged: boolean
  hasReadLesson: boolean
  hasBaselinePhotos: boolean
  firstLessonSlug: string | null
}

/**
 * Week 0 — what a client sees between finishing onboarding and submitting her
 * first check-in.
 *
 * This used to be a single full-screen "do your first check-in" wall with no
 * navigation, which meant a client who had just paid could not reach her plan,
 * labs, lessons or coach. That's the highest-churn moment in the funnel, so it
 * now gives her real things to do today and completes as she does them.
 */
export function EmptyCheckInState({ name, status }: { name: string; status?: Week0Status }) {
  const s: Week0Status = status ?? {
    hasPlan: false, hasLabs: false, hasMedication: false,
    hasMessaged: false, hasReadLesson: false, hasBaselinePhotos: false, firstLessonSlug: null,
  }

  const steps = [
    {
      done: s.hasMedication,
      icon: Pill,
      title: 'Add your thyroid medication',
      detail: 'So your reminders and plan respect your timing',
      href: '/dashboard/health',
      tint: '#155e56',
    },
    {
      // Deliberately high in the list: week-1 photos are the only ones that
      // can never be taken later, and without them there is no 3-month
      // before-and-after to show her.
      done: s.hasBaselinePhotos,
      icon: Camera,
      title: 'Take your week-1 photos',
      detail: "Today's the only day you can capture your starting point",
      href: '/dashboard/progress-photos',
      tint: '#97671b',
    },
    {
      done: s.hasLabs,
      icon: FlaskConical,
      title: 'Add your latest blood report',
      detail: 'Optional — but it makes week one far more personal',
      href: '/dashboard/health',
      tint: '#4a8a80',
    },
    {
      done: s.hasReadLesson,
      icon: BookOpen,
      title: 'Read your first lesson',
      detail: 'Two minutes on how to take your tablet for best effect',
      href: s.firstLessonSlug ? `/dashboard/learn/${s.firstLessonSlug}` : '/dashboard/learn',
      tint: '#b8863f',
    },
    {
      done: s.hasMessaged,
      icon: MessageSquare,
      title: 'Say hello to your coach',
      detail: 'Tell them what you want out of these three months',
      href: '/dashboard/messages',
      tint: '#155e56',
    },
  ]
  const doneCount = steps.filter((x) => x.done).length

  return (
    <div
      className="min-h-screen relative"
      style={{ background: '#fdfbf7', paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 24px))' }}
    >
      <div className="tw-glow" style={{ position: 'fixed', top: -150, left: 20, width: 350, height: 300, zIndex: 0 }} />

      <main className="max-w-2xl mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[10.5px] uppercase font-semibold" style={{ color: '#8b867c', letterSpacing: '0.16em' }}>
            Week one
          </p>
          <h1
            className="mt-1.5"
            style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 31, lineHeight: 1.15, color: '#1c1d20' }}
          >
            Welcome, {name}
          </h1>
          <p className="text-sm mt-2" style={{ color: '#5a564e', lineHeight: 1.55 }}>
            Everything starts small. Here&rsquo;s what to do while your plan is being built for you.
          </p>
        </motion.div>

        {/* Plan status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5"
        >
          {s.hasPlan ? (
            <Link
              href="/dashboard/plans"
              className="flex items-center gap-3 p-5 rounded-3xl"
              style={{ background: 'rgba(21, 94, 86, 0.13)', border: '1px solid rgba(21, 94, 86,0.25)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(21, 94, 86,0.15)' }}>
                <Sparkles size={19} style={{ color: '#155e56' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#1c1d20' }}>Your plan is ready</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: '#8b867c' }}>Open it and start when you feel ready</p>
              </div>
              <ChevronRight size={18} style={{ color: '#155e56' }} />
            </Link>
          ) : (
            <div
              className="flex items-center gap-3 p-5 rounded-3xl"
              style={{ background: '#ffffff', border: '1px dashed #cfc7b6' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(21, 94, 86,0.1)' }}>
                <Sparkles size={19} style={{ color: '#155e56' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#1c1d20' }}>Your coach is building your plan</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: '#8b867c' }}>
                  It&rsquo;ll appear here — the steps below matter more in week one anyway
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Starter checklist */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mt-7 mb-2.5 px-0.5">
            <p className="text-[10.5px] uppercase font-semibold" style={{ color: '#8b867c', letterSpacing: '0.16em' }}>
              Start here
            </p>
            <span className="text-[11px] tabular-nums" style={{ color: doneCount === steps.length ? '#155e56' : '#a09a8e' }}>
              {doneCount}/{steps.length} done
            </span>
          </div>

          <div className="space-y-2.5">
            {steps.map((step) => (
              <Link
                key={step.title}
                href={step.href}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{
                  background: step.done ? 'rgba(21, 94, 86, 0.13)' : '#ffffff',
                  border: `1px solid ${step.done ? 'rgba(21, 94, 86,0.18)' : '#e2dbcd'}`,
                }}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: step.done ? 'rgba(21, 94, 86,0.14)' : `${step.tint}1f` }}
                >
                  {step.done
                    ? <Check size={17} style={{ color: '#155e56' }} strokeWidth={3} />
                    : <step.icon size={17} style={{ color: step.tint }} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: step.done ? '#5a564e' : '#1c1d20' }}>
                    {step.title}
                  </p>
                  <p className="text-[11.5px] mt-0.5" style={{ color: '#8b867c' }}>{step.detail}</p>
                </div>
                {!step.done && <ChevronRight size={16} className="shrink-0" style={{ color: '#cfc7b6' }} />}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* First check-in */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
          <p className="text-sm text-center mb-3" style={{ color: '#5a564e', lineHeight: 1.55 }}>
            At the end of your first week, your check-in unlocks your trends —
            weight, energy, sleep and symptoms, all in one place.
          </p>
          <Link href="/dashboard/check-in">
            <button
              className="w-full h-13 py-4 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #155e56 0%, #155e56 100%)',
                boxShadow: '0 8px 28px rgba(21, 94, 86, 0.28)',
              }}
            >
              Start your first check-in
              <ArrowRight size={17} />
            </button>
          </Link>
          <p className="text-[11px] text-center mt-3" style={{ color: '#a09a8e' }}>
            About 5 minutes · your data stays private to you and your coach
          </p>
        </motion.div>
      </main>

      <BottomNavPill />
    </div>
  )
}
