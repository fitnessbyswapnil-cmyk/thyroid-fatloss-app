"use client"

import { Activity, TrendingUp, Sparkles, Heart, Zap, Moon, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

const scoreFactors = [
  { name: "TSH Balance", score: 82, icon: Activity, color: "text-primary" },
  { name: "Energy Levels", score: 75, icon: Zap, color: "text-accent-foreground" },
  { name: "Sleep Quality", score: 88, icon: Moon, color: "text-secondary" },
  { name: "Mental Clarity", score: 71, icon: Brain, color: "text-primary" },
]

export function RecoveryScore() {
  const overallScore = 79
  const previousScore = 68
  const improvement = overallScore - previousScore
  
  // Calculate stroke dash for circular progress
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (overallScore / 100) * circumference
  
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1f35] via-[#1e2640] to-[#232a45] p-6 shadow-2xl">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-secondary/15 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-32 h-32 bg-accent/20 rounded-full blur-[40px] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Thyroid Recovery</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Your Wellness Score</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 border border-secondary/30">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <span className="text-sm font-bold text-secondary">+{improvement}</span>
          </div>
        </div>
        
        {/* Circular Score Display */}
        <div className="flex items-center justify-center my-8">
          <div className="relative">
            {/* Background ring */}
            <svg className="w-44 h-44 -rotate-90">
              <circle
                cx="88"
                cy="88"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
              />
              {/* Progress ring */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
                style={{ filter: 'drop-shadow(0 0 8px oklch(0.68 0.1 150 / 0.5))' }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="oklch(0.52 0.12 250)" />
                  <stop offset="50%" stopColor="oklch(0.68 0.1 150)" />
                  <stop offset="100%" stopColor="oklch(0.82 0.12 80)" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent mb-1" />
              <span className="text-5xl font-bold text-white tracking-tight">{overallScore}</span>
              <span className="text-sm font-medium text-white/50 mt-1">out of 100</span>
            </div>
          </div>
        </div>
        
        {/* Score factors */}
        <div className="grid grid-cols-2 gap-3">
          {scoreFactors.map((factor, index) => {
            const Icon = factor.icon
            return (
              <div 
                key={index}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-white/10">
                    <Icon className={cn("h-4 w-4", factor.color)} />
                  </div>
                  <span className="text-xs font-medium text-white/60">{factor.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{factor.score}</span>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Insight */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-secondary/20 to-secondary/10 border border-secondary/20">
          <p className="text-sm text-white/80 leading-relaxed">
            <span className="font-semibold text-secondary">Great progress!</span> Your thyroid function is improving. Focus on sleep consistency to boost your score further.
          </p>
        </div>
      </div>
    </div>
  )
}
