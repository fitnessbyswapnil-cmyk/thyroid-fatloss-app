"use client"

import { Play, Clock, ChevronRight, Dumbbell, Check, Heart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const exercises = [
  { name: "Warm-up Stretches", duration: "5 min", completed: true },
  { name: "Low-Impact Cardio", duration: "15 min", completed: true },
  { name: "Resistance Band Training", duration: "20 min", completed: false },
  { name: "Core Strengthening", duration: "10 min", completed: false },
  { name: "Cool-down & Breathing", duration: "5 min", completed: false },
]

export function WorkoutPlan() {
  const completed = exercises.filter(e => e.completed).length
  const progress = (completed / exercises.length) * 100
  const isComplete = completed === exercises.length
  
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Today&apos;s Workout</h3>
            <p className="text-xs text-muted-foreground mt-1">Gentle hormonal balance routine</p>
          </div>
          <Button variant="ghost" className="text-primary text-sm font-medium h-9 px-3 rounded-xl hover:bg-primary/5">
            All Plans <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* Workout overview card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/25 via-accent/15 to-accent/5 border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/30">
                <Dumbbell className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tracking-tight">55 min</p>
                <p className="text-xs text-muted-foreground">Low intensity</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/30 border border-accent/30">
                <Heart className="h-3.5 w-3.5 text-accent-foreground" />
                <span className="text-xs font-semibold text-accent-foreground">Hormone-safe</span>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{completed} of {exercises.length} exercises</span>
              <span className="font-bold text-accent-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-accent/20 overflow-hidden">
              <div 
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Exercise list */}
      <div className="px-6 pb-4 space-y-3">
        {exercises.map((exercise, index) => (
          <div 
            key={index}
            className={cn(
              "group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
              exercise.completed 
                ? "bg-secondary/10 border border-secondary/20" 
                : "bg-muted/30 hover:bg-muted/50 border border-transparent"
            )}
          >
            {/* Status icon */}
            <div className={cn(
              "shrink-0 p-2.5 rounded-xl transition-all duration-300",
              exercise.completed 
                ? "bg-secondary text-secondary-foreground shadow-md" 
                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              {exercise.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-semibold transition-all",
                exercise.completed ? "text-muted-foreground" : "text-foreground"
              )}>
                {exercise.name}
              </p>
            </div>
            
            {/* Duration */}
            <div className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
              exercise.completed 
                ? "bg-secondary/20 text-secondary" 
                : "bg-muted text-muted-foreground"
            )}>
              <Clock className="h-3.5 w-3.5" />
              {exercise.duration}
            </div>
          </div>
        ))}
      </div>
      
      {/* CTA Button */}
      <div className="px-6 pb-6">
        <Button 
          className={cn(
            "w-full h-14 rounded-2xl font-semibold text-base transition-all shine",
            isComplete 
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" 
              : "btn-premium text-primary-foreground"
          )}
        >
          {isComplete ? (
            <>
              <Sparkles className="h-5 w-5 mr-3" />
              Workout Complete!
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-3 fill-current" />
              Continue Workout
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
