"use client"

import { Flame, Trophy, Star, Calendar, Target, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const weekDays = [
  { day: "M", completed: true },
  { day: "T", completed: true },
  { day: "W", completed: true },
  { day: "T", completed: true },
  { day: "F", completed: true },
  { day: "S", completed: false, isToday: true },
  { day: "S", completed: false },
]

const milestones = [
  { days: 7, label: "1 Week", achieved: true },
  { days: 14, label: "2 Weeks", achieved: true },
  { days: 30, label: "1 Month", achieved: false, current: true },
  { days: 60, label: "2 Months", achieved: false },
]

export function ConsistencyStreak() {
  const currentStreak = 19
  const bestStreak = 24
  const monthlyGoal = 30
  const progress = (currentStreak / monthlyGoal) * 100
  
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header with flame animation */}
      <div className="relative p-6 pb-4 bg-gradient-to-br from-accent/10 via-transparent to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                {/* Flame glow */}
                <div className="absolute inset-0 rounded-2xl bg-orange-400/30 blur-lg -z-10" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Consistency Streak</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Keep the momentum going!</p>
          </div>
          
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground tracking-tight">{currentStreak}</span>
              <span className="text-lg font-medium text-muted-foreground">days</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 justify-end">
              <Trophy className="h-3.5 w-3.5 text-accent-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Best: {bestStreak}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Weekly progress dots */}
      <div className="px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">This Week</p>
        <div className="flex items-center justify-between gap-2">
          {weekDays.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className={cn(
                "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                day.completed 
                  ? "bg-gradient-to-br from-secondary to-secondary/80 shadow-lg" 
                  : day.isToday
                    ? "bg-primary/10 border-2 border-dashed border-primary"
                    : "bg-muted"
              )}>
                {day.completed ? (
                  <Star className="h-4 w-4 text-white fill-white" />
                ) : day.isToday ? (
                  <Target className="h-4 w-4 text-primary" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
                
                {/* Today pulse */}
                {day.isToday && (
                  <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
                )}
              </div>
              <span className={cn(
                "text-xs font-semibold",
                day.completed ? "text-secondary" : day.isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {day.day}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Monthly milestone progress */}
      <div className="px-6 pb-4">
        <div className="p-4 rounded-2xl bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Monthly Goal</span>
            </div>
            <span className="text-sm font-bold text-primary">{currentStreak}/{monthlyGoal}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Milestone badges */}
      <div className="px-6 pb-6">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Milestones</p>
        <div className="flex items-center gap-2">
          {milestones.map((milestone, index) => (
            <div 
              key={index}
              className={cn(
                "flex-1 p-3 rounded-xl text-center transition-all duration-300",
                milestone.achieved
                  ? "bg-secondary/15 border border-secondary/30"
                  : milestone.current
                    ? "bg-primary/10 border border-dashed border-primary/50"
                    : "bg-muted/50"
              )}
            >
              <div className={cn(
                "text-lg font-bold tracking-tight",
                milestone.achieved
                  ? "text-secondary"
                  : milestone.current
                    ? "text-primary"
                    : "text-muted-foreground"
              )}>
                {milestone.days}
              </div>
              <div className={cn(
                "text-[10px] font-medium uppercase tracking-wider mt-0.5",
                milestone.achieved || milestone.current ? "text-muted-foreground" : "text-muted-foreground/60"
              )}>
                {milestone.label}
              </div>
              {milestone.achieved && (
                <Sparkles className="h-3 w-3 text-secondary mx-auto mt-1" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
