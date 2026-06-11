"use client"

import { Moon, Zap, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const weekData = [
  { day: "Mon", energy: 6, sleep: 7 },
  { day: "Tue", energy: 7, sleep: 7.5 },
  { day: "Wed", energy: 5, sleep: 6 },
  { day: "Thu", energy: 8, sleep: 8 },
  { day: "Fri", energy: 7, sleep: 7 },
  { day: "Sat", energy: 8, sleep: 8.5 },
  { day: "Sun", energy: 9, sleep: 8 },
]

export function EnergySleepTracker() {
  const avgEnergy = (weekData.reduce((sum, d) => sum + d.energy, 0) / weekData.length).toFixed(1)
  const avgSleep = (weekData.reduce((sum, d) => sum + d.sleep, 0) / weekData.length).toFixed(1)
  const energyProgress = Number(avgEnergy) * 10
  const sleepProgress = (Number(avgSleep) / 9) * 100
  
  return (
    <div className="premium-card rounded-3xl border border-border/40 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">Energy & Sleep</h3>
          <p className="text-xs text-muted-foreground mt-1">Weekly averages</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/15 text-secondary">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">+18%</span>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Energy card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/25 via-accent/15 to-accent/5 border border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-accent/30">
              <Zap className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Energy</span>
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-bold text-foreground tracking-tight">{avgEnergy}</span>
            <span className="text-sm text-muted-foreground font-medium">/10</span>
          </div>
          <div className="h-2 rounded-full bg-accent/20 overflow-hidden">
            <div 
              className="h-full rounded-full bg-accent transition-all duration-700"
              style={{ width: `${energyProgress}%` }}
            />
          </div>
        </div>
        
        {/* Sleep card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Moon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Sleep</span>
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-bold text-foreground tracking-tight">{avgSleep}</span>
            <span className="text-sm text-muted-foreground font-medium">hrs</span>
          </div>
          <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
            <div 
              className="h-full rounded-full gradient-primary transition-all duration-700"
              style={{ width: `${sleepProgress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Weekly chart */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">This Week</p>
        <div className="flex gap-2">
          {weekData.map((day, i) => {
            const isToday = i === weekData.length - 1
            return (
              <div key={i} className="flex-1 text-center">
                <div 
                  className={cn(
                    "relative h-20 rounded-xl mb-2 flex flex-col justify-end overflow-hidden transition-all duration-300",
                    isToday ? "bg-primary/10" : "bg-muted/50"
                  )}
                >
                  <div 
                    className={cn(
                      "rounded-t-lg transition-all duration-500 ease-out",
                      isToday ? "gradient-primary glow-primary" : ""
                    )}
                    style={{ 
                      height: `${(day.energy / 10) * 100}%`,
                      backgroundColor: isToday ? undefined : 'oklch(0.52 0.12 250 / 0.6)'
                    }}
                  />
                  
                  {/* Energy value tooltip on hover */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-primary">{day.energy}</span>
                  </div>
                </div>
                <span className={cn(
                  "text-[11px] font-medium transition-colors",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {day.day}
                </span>
                {isToday && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
