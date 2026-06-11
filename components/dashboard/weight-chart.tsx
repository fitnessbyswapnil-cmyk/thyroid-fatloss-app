"use client"

import { TrendingDown, Target, ChevronRight } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

const weightData = [
  { week: "W1", weight: 82.5 },
  { week: "W2", weight: 81.8 },
  { week: "W3", weight: 81.2 },
  { week: "W4", weight: 80.5 },
  { week: "W5", weight: 79.8 },
  { week: "W6", weight: 79.2 },
  { week: "W7", weight: 78.6 },
  { week: "W8", weight: 78.1 },
]

export function WeightChart() {
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Weight Progress</h3>
            <p className="text-xs text-muted-foreground mt-1">Your transformation journey</p>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
            Details <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex-1 p-4 rounded-2xl bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingDown className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Current</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground tracking-tight">78.1</span>
              <span className="text-sm text-muted-foreground font-medium">kg</span>
            </div>
          </div>
          
          <div className="flex-1 p-4 rounded-2xl bg-secondary/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-secondary/20">
                <Target className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Goal</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground tracking-tight">72</span>
              <span className="text-sm text-muted-foreground font-medium">kg</span>
            </div>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-5 p-3 rounded-xl bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent border border-secondary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total Lost</span>
            <span className="text-lg font-bold text-secondary">-4.4 kg</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full gradient-secondary transition-all duration-500"
              style={{ width: '72%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">72% to your goal weight</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="px-2 pb-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.52 0.12 250)" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="oklch(0.52 0.12 250)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="oklch(0.52 0.12 250)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="week" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'oklch(0.48 0.02 260)', fontWeight: 500 }}
                dy={8}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']} 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 11, fill: 'oklch(0.48 0.02 260)', fontWeight: 500 }}
                dx={-5}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  padding: '12px 16px'
                }}
                formatter={(value: number) => [`${value} kg`, 'Weight']}
                labelStyle={{ color: 'oklch(0.48 0.02 260)', fontWeight: 500, marginBottom: 4 }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="oklch(0.52 0.12 250)" 
                strokeWidth={3}
                fill="url(#weightGradient)" 
                dot={{ fill: 'white', stroke: 'oklch(0.52 0.12 250)', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: 'oklch(0.52 0.12 250)', stroke: 'white', strokeWidth: 3, r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
