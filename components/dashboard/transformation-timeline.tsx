"use client"

import { Check, Clock, Star, Trophy, TrendingUp, Sparkles, ChevronRight, Zap, Moon, Scale, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

const milestones = [
  {
    week: 1,
    title: "Foundation Week",
    description: "Started thyroid-optimized nutrition plan",
    date: "Mar 15",
    status: "completed" as const,
    icon: Activity,
    achievements: ["First meal plan", "Baseline labs"],
    color: "secondary",
  },
  {
    week: 4,
    title: "Energy Breakthrough",
    description: "First signs of improved energy levels",
    date: "Apr 5",
    status: "completed" as const,
    icon: Zap,
    achievements: ["+25% energy", "Better focus"],
    color: "accent",
  },
  {
    week: 6,
    title: "Sleep Optimization",
    description: "Achieved consistent 7+ hour sleep",
    date: "Apr 19",
    status: "completed" as const,
    icon: Moon,
    achievements: ["7.5hr avg sleep", "Reduced fatigue"],
    color: "primary",
  },
  {
    week: 8,
    title: "Weight Milestone",
    description: "4+ kg weight loss achieved",
    date: "May 3",
    status: "current" as const,
    icon: Scale,
    achievements: ["-4.4 kg", "TSH improving"],
    color: "secondary",
  },
  {
    week: 12,
    title: "Transformation Complete",
    description: "Full hormone balance restoration",
    date: "May 31",
    status: "upcoming" as const,
    icon: Trophy,
    achievements: ["Goal weight", "Optimal TSH"],
    color: "accent",
  },
]

export function TransformationTimeline() {
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-accent-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Journey</span>
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Transformation Timeline</h3>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
            Full story <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="px-6 pb-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-secondary via-primary to-muted" />
          
          <div className="space-y-6">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon
              const isCompleted = milestone.status === "completed"
              const isCurrent = milestone.status === "current"
              const isUpcoming = milestone.status === "upcoming"
              
              const colorStyles = {
                primary: "bg-primary text-primary-foreground",
                secondary: "bg-secondary text-secondary-foreground",
                accent: "bg-accent text-accent-foreground",
              }
              
              return (
                <div key={index} className="relative flex gap-4 pl-2">
                  {/* Timeline dot */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-all duration-300",
                    isCompleted && colorStyles[milestone.color as keyof typeof colorStyles],
                    isCurrent && "bg-white border-2 border-primary shadow-lg",
                    isUpcoming && "bg-muted border border-border"
                  )}>
                    {isCompleted && <Check className="h-3.5 w-3.5" />}
                    {isCurrent && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    {isUpcoming && <Clock className="h-3 w-3 text-muted-foreground" />}
                    
                    {/* Current pulse ring */}
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-full border border-primary animate-ping opacity-40" />
                    )}
                  </div>
                  
                  {/* Content card */}
                  <div className={cn(
                    "flex-1 p-4 rounded-2xl transition-all duration-300",
                    isCompleted && "bg-muted/50 hover:bg-muted/70",
                    isCurrent && "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-lg",
                    isUpcoming && "bg-muted/30 opacity-70"
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            isCompleted ? "text-muted-foreground" : isCurrent ? "text-primary" : "text-muted-foreground/60"
                          )}>
                            Week {milestone.week}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase">
                              <Sparkles className="h-2.5 w-2.5" />
                              Now
                            </span>
                          )}
                        </div>
                        <h4 className={cn(
                          "text-base font-bold tracking-tight",
                          isUpcoming ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {milestone.title}
                        </h4>
                      </div>
                      <div className={cn(
                        "p-2 rounded-xl",
                        isCompleted && "bg-card",
                        isCurrent && "bg-primary/10",
                        isUpcoming && "bg-muted"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isCompleted && "text-muted-foreground",
                          isCurrent && "text-primary",
                          isUpcoming && "text-muted-foreground/60"
                        )} />
                      </div>
                    </div>
                    
                    <p className={cn(
                      "text-sm leading-relaxed mb-3",
                      isUpcoming ? "text-muted-foreground/60" : "text-muted-foreground"
                    )}>
                      {milestone.description}
                    </p>
                    
                    {/* Achievement tags */}
                    <div className="flex items-center gap-2">
                      {milestone.achievements.map((achievement, i) => (
                        <span 
                          key={i}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            isCompleted && "bg-secondary/15 text-secondary",
                            isCurrent && "bg-primary/15 text-primary",
                            isUpcoming && "bg-muted text-muted-foreground/60"
                          )}
                        >
                          {achievement}
                        </span>
                      ))}
                    </div>
                    
                    <div className={cn(
                      "text-[10px] font-medium mt-3 uppercase tracking-wider",
                      isUpcoming ? "text-muted-foreground/40" : "text-muted-foreground/60"
                    )}>
                      {milestone.date}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
