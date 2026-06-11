"use client"

import { Home, TrendingUp, Utensils, Dumbbell, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: TrendingUp, label: "Progress", active: false },
  { icon: Utensils, label: "Meals", active: false, badge: true },
  { icon: Dumbbell, label: "Workout", active: false },
  { icon: User, label: "Profile", active: false },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Premium frosted glass background */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/98 to-white/95 backdrop-blur-xl border-t border-border/30" />
      
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="relative flex items-center justify-around py-2 px-3 max-w-lg mx-auto pb-safe">
        {navItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={index}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all duration-300 min-w-[60px]",
                item.active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active background glow */}
              {item.active && (
                <div className="absolute inset-0 bg-primary/8 rounded-2xl" />
              )}
              
              {/* Icon container */}
              <div className={cn(
                "relative p-2.5 rounded-2xl transition-all duration-300",
                item.active 
                  ? "bg-gradient-to-br from-primary to-primary/90 shadow-lg shadow-primary/25" 
                  : "bg-transparent"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  item.active ? "text-white" : ""
                )} />
                
                {/* Badge notification */}
                {item.badge && !item.active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-white" />
                )}
                
                {/* Active sparkle */}
                {item.active && (
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent" />
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-semibold tracking-wide transition-all mt-0.5",
                item.active && "text-primary"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
