"use client"

import { Camera, ChevronRight, ImagePlus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BeforeAfter() {
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Transformation</h3>
            <p className="text-xs text-muted-foreground mt-1">Your visual progress journey</p>
          </div>
          <Button variant="ghost" className="text-primary text-sm font-medium h-9 px-3 rounded-xl hover:bg-primary/5">
            Gallery <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Photo comparison */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Before photo */}
          <div className="relative group">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted/50 border border-border/50">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Before</p>
                  <p className="text-xs text-muted-foreground">Day 1</p>
                </div>
              </div>
            </div>
            {/* Weight badge */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="glass rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Start</span>
                <span className="text-sm font-bold text-foreground">82.5 kg</span>
              </div>
            </div>
          </div>
          
          {/* Current photo */}
          <div className="relative group">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/20 via-primary/15 to-accent/10 border border-secondary/30">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-secondary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Current</p>
                  <p className="text-xs text-muted-foreground">Week 8</p>
                </div>
              </div>
            </div>
            {/* Weight badge */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="glass rounded-xl px-3 py-2 flex items-center justify-between border border-secondary/20">
                <span className="text-xs font-medium text-secondary">Now</span>
                <span className="text-sm font-bold text-secondary">78.1 kg</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Difference indicator */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent border border-secondary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-secondary">-4.4 kg</span>
              <div className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold">
                5.3%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add photo CTA */}
      <div className="px-6 pb-6">
        <Button className="w-full h-14 rounded-2xl bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]">
          <ImagePlus className="h-5 w-5 mr-3" />
          Add Progress Photo
        </Button>
      </div>
    </div>
  )
}
