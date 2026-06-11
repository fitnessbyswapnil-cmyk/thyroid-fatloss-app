"use client"

import { Plus, Camera, Droplets, Apple, Dumbbell, Moon, MessageSquare, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const actions = [
  { icon: Camera, label: "Progress Photo", color: "primary", glow: "primary" },
  { icon: Droplets, label: "Log Water", color: "primary", glow: "primary" },
  { icon: Apple, label: "Log Meal", color: "secondary", glow: "secondary" },
  { icon: Dumbbell, label: "Log Workout", color: "secondary", glow: "secondary" },
  { icon: Moon, label: "Log Sleep", color: "accent", glow: "accent" },
  { icon: MessageSquare, label: "Ask Coach", color: "primary", glow: "primary" },
]

export function QuickActions() {
  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-bold text-foreground tracking-tight">Quick Actions</h3>
        </div>
        <span className="text-xs text-muted-foreground">Tap to log</span>
      </div>
      
      {/* Actions grid */}
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              className={cn(
                "group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-300",
                "bg-card border border-border/40 shadow-sm",
                "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                action.color === "primary" && "hover:border-primary/30 hover:bg-primary/5",
                action.color === "secondary" && "hover:border-secondary/30 hover:bg-secondary/5",
                action.color === "accent" && "hover:border-accent/30 hover:bg-accent/10",
              )}
            >
              {/* Icon container with glow */}
              <div className={cn(
                "relative p-3 rounded-xl transition-all duration-300",
                action.color === "primary" && "bg-primary/10 group-hover:bg-primary/15",
                action.color === "secondary" && "bg-secondary/10 group-hover:bg-secondary/15",
                action.color === "accent" && "bg-accent/20 group-hover:bg-accent/25",
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  action.color === "primary" && "text-primary",
                  action.color === "secondary" && "text-secondary",
                  action.color === "accent" && "text-accent-foreground",
                )} />
                
                {/* Hover glow effect */}
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg",
                  action.glow === "primary" && "bg-primary/30",
                  action.glow === "secondary" && "bg-secondary/30",
                  action.glow === "accent" && "bg-accent/30",
                )} />
              </div>
              
              <span className="text-xs font-semibold text-foreground text-center leading-tight">
                {action.label}
              </span>
              
              {/* Plus indicator */}
              <div className={cn(
                "absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300",
                action.color === "primary" && "bg-primary/20",
                action.color === "secondary" && "bg-secondary/20",
                action.color === "accent" && "bg-accent/30",
              )}>
                <Plus className={cn(
                  "h-3 w-3",
                  action.color === "primary" && "text-primary",
                  action.color === "secondary" && "text-secondary",
                  action.color === "accent" && "text-accent-foreground",
                )} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
