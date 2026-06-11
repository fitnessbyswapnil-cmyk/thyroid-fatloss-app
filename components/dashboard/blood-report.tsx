"use client"

import { TrendingUp, TrendingDown, FileText, ChevronRight, Activity, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const labResults = [
  { 
    name: "TSH", 
    before: "8.5", 
    current: "4.2", 
    unit: "mIU/L", 
    normal: "0.4-4.0",
    trend: "improved",
    change: -50.6
  },
  { 
    name: "T3", 
    before: "60", 
    current: "95", 
    unit: "ng/dL", 
    normal: "80-200",
    trend: "improved",
    change: 58.3
  },
  { 
    name: "T4", 
    before: "4.5", 
    current: "7.8", 
    unit: "μg/dL", 
    normal: "4.5-12.5",
    trend: "improved",
    change: 73.3
  },
  { 
    name: "TPO Ab", 
    before: "420", 
    current: "280", 
    unit: "IU/mL", 
    normal: "<35",
    trend: "improving",
    change: -33.3
  },
]

export function BloodReport() {
  const improvedCount = labResults.filter(r => r.trend === 'improved').length
  
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Blood Report</h3>
            <p className="text-xs text-muted-foreground mt-1">Week 1 vs Week 8 comparison</p>
          </div>
          <Button variant="ghost" className="text-primary text-sm font-medium h-9 px-3 rounded-xl hover:bg-primary/5">
            Full Report <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* Overview card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary/15 via-secondary/10 to-secondary/5 border border-secondary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary/20">
              <Activity className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Overall Thyroid Health</p>
              <p className="text-xl font-bold text-foreground tracking-tight">Significantly Improved</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/20 border border-secondary/30">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              <span className="text-xs font-semibold text-secondary">{improvedCount}/{labResults.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lab results */}
      <div className="px-6 pb-4 space-y-3">
        {labResults.map((result, index) => (
          <div 
            key={index} 
            className="p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-300"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">{result.name}</span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {result.unit}
                </span>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                result.trend === 'improved' 
                  ? "bg-secondary/15 text-secondary" 
                  : "bg-accent/20 text-accent-foreground"
              )}>
                {result.change > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>{Math.abs(result.change).toFixed(0)}%</span>
              </div>
            </div>
            
            {/* Values row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Before</p>
                <p className="text-lg font-bold text-muted-foreground">{result.before}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1">Current</p>
                <p className="text-lg font-bold text-primary">{result.current}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Normal</p>
                <p className="text-sm font-semibold text-secondary">{result.normal}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Upload CTA */}
      <div className="px-6 pb-6">
        <Button 
          variant="outline" 
          className="w-full h-14 rounded-2xl font-semibold border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
        >
          <Upload className="h-5 w-5 mr-3" />
          Upload New Blood Report
        </Button>
      </div>
    </div>
  )
}
