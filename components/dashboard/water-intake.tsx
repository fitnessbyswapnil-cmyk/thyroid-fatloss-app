"use client"

import { Droplets, Plus, Minus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function WaterIntake() {
  const [glasses, setGlasses] = useState(5)
  const goal = 8
  const progress = (glasses / goal) * 100
  const circumference = 2 * Math.PI * 52
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  const isGoalReached = glasses >= goal
  
  return (
    <div className={cn(
      "premium-card rounded-3xl border border-border/40 p-6 transition-all duration-500",
      isGoalReached && "border-secondary/30 bg-gradient-to-br from-card via-card to-secondary/5"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">Water Intake</h3>
          <p className="text-xs text-muted-foreground mt-1">Stay hydrated for thyroid health</p>
        </div>
        <div className={cn(
          "p-3 rounded-xl transition-all duration-300",
          isGoalReached 
            ? "bg-secondary/20 text-secondary glow-secondary" 
            : "bg-primary/10 text-primary"
        )}>
          <Droplets className="h-5 w-5" />
        </div>
      </div>
      
      {/* Circular Progress */}
      <div className="flex items-center justify-center py-6">
        <div className="relative w-36 h-36">
          {/* Background glow */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl transition-all duration-500",
            isGoalReached ? "bg-secondary/20" : "bg-primary/10"
          )} />
          
          <svg className="w-full h-full transform -rotate-90 relative">
            {/* Background circle */}
            <circle
              cx="72"
              cy="72"
              r="52"
              fill="none"
              stroke="oklch(0.93 0.006 85)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="72"
              cy="72"
              r="52"
              fill="none"
              stroke={isGoalReached ? "oklch(0.68 0.1 150)" : "oklch(0.52 0.12 250)"}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{
                filter: isGoalReached ? 'drop-shadow(0 0 8px oklch(0.68 0.1 150 / 0.5))' : 'drop-shadow(0 0 8px oklch(0.52 0.12 250 / 0.3))'
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isGoalReached ? (
              <>
                <Sparkles className="h-6 w-6 text-secondary mb-1" />
                <span className="text-sm font-bold text-secondary">Goal!</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold text-foreground tracking-tight">{glasses}</span>
                <span className="text-xs text-muted-foreground font-medium">of {goal} glasses</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setGlasses(Math.max(0, glasses - 1))}
          className="h-12 w-12 rounded-2xl border-2 hover:bg-muted/50 hover:scale-105 transition-all duration-300 active:scale-95"
        >
          <Minus className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <span className="text-sm font-bold text-foreground">250ml</span>
          <p className="text-xs text-muted-foreground">per glass</p>
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setGlasses(Math.min(12, glasses + 1))}
          className={cn(
            "h-12 w-12 rounded-2xl border-2 hover:scale-105 transition-all duration-300 active:scale-95",
            !isGoalReached && "border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary"
          )}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Status message */}
      <div className={cn(
        "mt-6 p-4 rounded-2xl text-center transition-all duration-500",
        isGoalReached 
          ? "bg-gradient-to-r from-secondary/15 via-secondary/10 to-secondary/15 border border-secondary/20" 
          : "bg-muted/30"
      )}>
        {isGoalReached ? (
          <>
            <p className="text-sm font-bold text-secondary">Hydration goal achieved!</p>
            <p className="text-xs text-muted-foreground mt-1">Great job staying hydrated today</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">{goal - glasses} more glasses to go</p>
            <p className="text-xs text-muted-foreground mt-1">You can do it!</p>
          </>
        )}
      </div>
    </div>
  )
}
