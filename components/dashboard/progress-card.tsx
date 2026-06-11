"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressCardProps {
  title: string
  value: string
  change: number
  changeLabel: string
  icon: React.ReactNode
  trend?: "up" | "down"
  accentColor?: "primary" | "secondary" | "accent"
}

export function ProgressCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  trend = "up",
  accentColor = "primary" 
}: ProgressCardProps) {
  const isPositive = trend === "up"
  
  const accentStyles = {
    primary: {
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      glowColor: "group-hover:shadow-[0_8px_24px_-4px] group-hover:shadow-primary/20",
    },
    secondary: {
      iconBg: "bg-secondary/15",
      iconColor: "text-secondary",
      glowColor: "group-hover:shadow-[0_8px_24px_-4px] group-hover:shadow-secondary/20",
    },
    accent: {
      iconBg: "bg-accent/20",
      iconColor: "text-accent-foreground",
      glowColor: "group-hover:shadow-[0_8px_24px_-4px] group-hover:shadow-accent/30",
    },
  }

  const styles = accentStyles[accentColor]
  
  return (
    <div className={cn(
      "group premium-card p-5 rounded-2xl border border-border/40 cursor-pointer",
      styles.glowColor
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
          styles.iconBg,
          styles.iconColor
        )}>
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
          isPositive 
            ? "bg-secondary/15 text-secondary" 
            : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight mb-1">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/70 mt-1.5">{changeLabel}</p>
      </div>
    </div>
  )
}
