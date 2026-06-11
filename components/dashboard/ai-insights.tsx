"use client"

import { useState } from "react"
import { Brain, Sparkles, ChevronRight, TrendingUp, AlertCircle, CheckCircle, Lightbulb, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const insights = [
  {
    type: "positive",
    icon: TrendingUp,
    title: "TSH Improving",
    description: "Your TSH dropped from 6.2 to 4.2. The morning routine is working beautifully.",
    action: "View Progress",
    color: "secondary",
  },
  {
    type: "tip",
    icon: Lightbulb,
    title: "Sleep Optimization",
    description: "Try avoiding screens 1 hour before bed. This can improve T3 conversion by up to 15%.",
    action: "Learn More",
    color: "accent",
  },
  {
    type: "alert",
    icon: AlertCircle,
    title: "Hydration Alert",
    description: "Your water intake dropped yesterday. Proper hydration supports thyroid function.",
    action: "Log Water",
    color: "primary",
  },
]

export function AIInsights() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeInsight = insights[activeIndex]
  const Icon = activeInsight.icon
  
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              {/* AI pulse */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary/60 items-center justify-center">
                  <Sparkles className="h-2 w-2 text-white" />
                </span>
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">AI Insights</h3>
              <p className="text-xs text-muted-foreground">Personalized for you</p>
            </div>
          </div>
          
          <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <span className="text-xs font-semibold text-primary">{insights.length} New</span>
          </div>
        </div>
      </div>
      
      {/* Main insight card */}
      <div className="px-6 pb-4">
        <div className={cn(
          "relative p-5 rounded-2xl transition-all duration-300",
          activeInsight.color === "secondary" && "bg-secondary/10 border border-secondary/20",
          activeInsight.color === "accent" && "bg-accent/15 border border-accent/20",
          activeInsight.color === "primary" && "bg-primary/10 border border-primary/20",
        )}>
          {/* Type badge */}
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              activeInsight.color === "secondary" && "bg-secondary/20",
              activeInsight.color === "accent" && "bg-accent/20",
              activeInsight.color === "primary" && "bg-primary/15",
            )}>
              <Icon className={cn(
                "h-4 w-4",
                activeInsight.color === "secondary" && "text-secondary",
                activeInsight.color === "accent" && "text-accent-foreground",
                activeInsight.color === "primary" && "text-primary",
              )} />
              <span className={cn(
                "text-xs font-semibold",
                activeInsight.color === "secondary" && "text-secondary",
                activeInsight.color === "accent" && "text-accent-foreground",
                activeInsight.color === "primary" && "text-primary",
              )}>
                {activeInsight.type === "positive" ? "Great Progress" : 
                 activeInsight.type === "tip" ? "Pro Tip" : "Attention"}
              </span>
            </div>
            
            {activeInsight.type === "positive" && (
              <CheckCircle className="h-5 w-5 text-secondary" />
            )}
          </div>
          
          <h4 className="text-base font-bold text-foreground mb-2">{activeInsight.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{activeInsight.description}</p>
          
          {/* Action button */}
          <button className={cn(
            "mt-4 flex items-center gap-2 text-sm font-semibold transition-all group",
            activeInsight.color === "secondary" && "text-secondary hover:gap-3",
            activeInsight.color === "accent" && "text-accent-foreground hover:gap-3",
            activeInsight.color === "primary" && "text-primary hover:gap-3",
          )}>
            {activeInsight.action}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
      
      {/* Navigation dots */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-3">
          {insights.map((insight, index) => {
            const ItemIcon = insight.icon
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                  index === activeIndex 
                    ? "bg-muted scale-105" 
                    : "bg-muted/40 hover:bg-muted/60"
                )}
              >
                <ItemIcon className={cn(
                  "h-4 w-4 transition-colors",
                  index === activeIndex ? "text-foreground" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  index === activeIndex ? "text-foreground" : "text-muted-foreground"
                )}>
                  {index + 1}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
