"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Sun, Moon, Pill, Droplets, Footprints, Apple, Brain, Trophy, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const habits = [
  { id: 1, name: "Morning Sun", fullName: "Morning Sunlight", icon: Sun, color: "accent", minutes: "15 min" },
  { id: 2, name: "Medication", fullName: "Thyroid Medication", icon: Pill, color: "primary", minutes: "Done" },
  { id: 3, name: "Hydration", fullName: "8 Glasses Water", icon: Droplets, color: "primary", minutes: "2.5L" },
  { id: 4, name: "Movement", fullName: "10K Steps", icon: Footprints, color: "secondary", minutes: "8.2K" },
  { id: 5, name: "Clean Eating", fullName: "No Processed Food", icon: Apple, color: "secondary", minutes: "On track" },
  { id: 6, name: "Destress", fullName: "Stress Management", icon: Brain, color: "accent", minutes: "10 min" },
  { id: 7, name: "Sleep", fullName: "Sleep by 10 PM", icon: Moon, color: "primary", minutes: "9:30 PM" },
]

export function HabitTracker() {
  const [completed, setCompleted] = useState<number[]>([1, 2, 4, 5])
  
  const toggleHabit = (id: number) => {
    setCompleted(prev => 
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    )
  }
  
  const progress = Math.round((completed.length / habits.length) * 100)
  const isAllComplete = progress === 100
  
  // Ring calculations
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [.22,1,.36,1] }}
      className={cn(
        "card-tier-1 rounded-[28px] border border-border/30 overflow-hidden",
        isAllComplete && "border-secondary/25"
      )}
    >
      {/* Header with completion ring */}
      <div className="p-7 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">Daily Habits</h3>
            <p className="text-sm text-muted-foreground mt-1 font-medium">{completed.length} of {habits.length} completed</p>
          </div>
          
          {/* Circular progress ring with premium animation */}
          <div className="relative">
            <svg className="w-24 h-24 -rotate-90">
              {/* Background ring */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="oklch(0.93 0.006 85)"
                strokeWidth="7"
              />
              {/* Progress ring */}
              <motion.circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke={isAllComplete ? "url(#habitCompleteGradient)" : "url(#habitProgressGradient)"}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, ease: [.22,1,.36,1] }}
                className={isAllComplete ? "ring-breathe" : ""}
              />
              <defs>
                <linearGradient id="habitProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="oklch(0.52 0.12 250)" />
                  <stop offset="100%" stopColor="oklch(0.58 0.14 260)" />
                </linearGradient>
                <linearGradient id="habitCompleteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="oklch(0.68 0.1 150)" />
                  <stop offset="100%" stopColor="oklch(0.72 0.12 160)" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center percentage with animation */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                key={progress}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  isAllComplete ? "text-secondary" : "text-foreground"
                )}
              >
                {progress}%
              </motion.span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Habits list */}
      <div className="px-5 pb-5">
        <div className="space-y-2.5">
          {habits.map((habit, index) => {
            const Icon = habit.icon
            const isCompleted = completed.includes(habit.id)
            
            const colorMap = {
              primary: {
                ring: "ring-primary/25",
                bg: "bg-primary",
                text: "text-primary",
                lightBg: "bg-primary/10",
              },
              secondary: {
                ring: "ring-secondary/25",
                bg: "bg-secondary",
                text: "text-secondary",
                lightBg: "bg-secondary/12",
              },
              accent: {
                ring: "ring-accent/30",
                bg: "bg-accent",
                text: "text-accent-foreground",
                lightBg: "bg-accent/18",
              },
            }
            
            const colors = colorMap[habit.color as keyof typeof colorMap]
            
            return (
              <motion.button
                key={habit.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05,
                  ease: [.22,1,.36,1]
                }}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleHabit(habit.id)}
                className={cn(
                  "w-full group flex items-center gap-4 p-4 rounded-2xl",
                  "transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                  isCompleted 
                    ? "bg-secondary/8 border border-secondary/18" 
                    : "bg-muted/40 hover:bg-muted/60 border border-transparent"
                )}
              >
                {/* Completion circle with animation */}
                <motion.div 
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                    "transition-all duration-500"
                  )}
                  animate={{
                    backgroundColor: isCompleted ? undefined : "transparent",
                  }}
                  style={{
                    background: isCompleted 
                      ? `linear-gradient(135deg, oklch(0.68 0.1 150), oklch(0.72 0.12 160))` 
                      : undefined,
                    boxShadow: isCompleted 
                      ? '0 8px 20px -4px oklch(0.68 0.1 150 / 0.4)' 
                      : 'none'
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Check className="h-5 w-5 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={cn("p-2.5 rounded-full ring-2", colors.lightBg, colors.ring)}
                      >
                        <Icon className={cn("h-5 w-5", colors.text)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Text content */}
                <div className="flex-1 text-left min-w-0">
                  <p className={cn(
                    "text-[15px] font-semibold truncate transition-all duration-500",
                    isCompleted ? "text-muted-foreground line-through decoration-secondary/40" : "text-foreground"
                  )}>
                    {habit.fullName}
                  </p>
                  <p className={cn(
                    "text-xs mt-1 font-medium",
                    isCompleted ? "text-secondary" : "text-muted-foreground"
                  )}>
                    {habit.minutes}
                  </p>
                </div>
                
                {/* Completed indicator or chevron */}
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div 
                      key="dot"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0 shadow-[0_0_8px_oklch(0.68_0.1_150/0.5)]"
                    />
                  ) : (
                    <motion.div
                      key="chevron"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors duration-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </div>
      
      {/* All complete celebration */}
      <AnimatePresence>
        {isAllComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [.22,1,.36,1] }}
            className="mx-5 mb-5 p-6 rounded-2xl bg-gradient-to-r from-secondary/15 via-accent/10 to-primary/8 border border-secondary/20"
          >
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="p-3.5 rounded-2xl bg-secondary/18 shadow-lg"
              >
                <Trophy className="h-6 w-6 text-secondary" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-foreground">Perfect Day!</p>
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">All habits completed. You&apos;re unstoppable!</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
