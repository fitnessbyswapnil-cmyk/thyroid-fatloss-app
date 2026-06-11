"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, Heart, ChevronRight, Star, Zap, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface WelcomeHeroProps {
  userName: string
  journeyWeek: number
  totalWeeks: number
}

export function WelcomeHero({ userName, journeyWeek, totalWeeks }: WelcomeHeroProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const firstName = userName.split(" ")[0]
  const progress = Math.round((journeyWeek / totalWeeks) * 100)
  
  useEffect(() => {
    // Show celebration animation on mount
    const timer = setTimeout(() => setShowCelebration(true), 500)
    return () => clearTimeout(timer)
  }, [])
  
  const greeting = getGreeting()
  
  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }
  
  const milestones = [
    { icon: Heart, label: "Healing", active: true },
    { icon: Zap, label: "Energy", active: true },
    { icon: Target, label: "Balance", active: false },
  ]
  
  return (
    <div className="relative overflow-hidden rounded-3xl min-h-[420px]">
      {/* Premium gradient background - 40% taller cinematic hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1f35] via-[#1e2640] to-[#252d4a]" />
      
      {/* Cinematic ambient lighting */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-56 h-56 bg-secondary/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Floating particles effect */}
      <div className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000",
        showCelebration ? "opacity-100" : "opacity-0"
      )}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent/60"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative p-6">
        {/* Top row - Greeting and journey badge */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{greeting}</span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">{firstName}</h2>
            <p className="text-sm text-white/60 mt-1">Your body is healing beautifully ✨</p>
          </div>
          
          {/* Journey progress badge */}
          <div className="flex flex-col items-end">
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent fill-accent" />
                <span className="text-sm font-bold text-white">Week {journeyWeek}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/50">Recovery Momentum</span>
            <span className="text-xs font-bold text-accent">{progress}% Healed</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-1000 ease-out"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 20px oklch(0.68 0.1 150 / 0.5)' 
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-white/40">Started</span>
            <span className="text-[10px] text-white/40">Full Recovery</span>
          </div>
        </div>
        
        {/* Milestone indicators */}
        <div className="flex items-center gap-3 mb-6">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon
            return (
              <div 
                key={index}
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all",
                  milestone.active 
                    ? "bg-white/10 border border-white/20" 
                    : "bg-white/5 border border-white/5"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4",
                  milestone.active ? "text-secondary" : "text-white/30"
                )} />
                <span className={cn(
                  "text-xs font-semibold",
                  milestone.active ? "text-white" : "text-white/30"
                )}>
                  {milestone.label}
                </span>
                {milestone.active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />
                )}
              </div>
            )
          })}
        </div>
        
        {/* CTA Button */}
        <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary/80">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Today&apos;s Recovery Plan</p>
              <p className="text-xs text-white/50">5 habits, 3 meals, 1 workout</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    </div>
  )
}
