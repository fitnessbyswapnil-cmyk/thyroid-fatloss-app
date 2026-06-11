"use client"

import { Calendar, MessageCircle, Video, ChevronRight, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CheckIn() {
  const daysUntilCheckIn = 4
  const cycleProgress = ((15 - daysUntilCheckIn) / 15) * 100
  
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">15-Day Check-In</h3>
            <p className="text-xs text-muted-foreground mt-1">Your next milestone</p>
          </div>
          <Button variant="ghost" className="text-primary text-sm font-medium h-9 px-3 rounded-xl hover:bg-primary/5">
            History <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* Countdown card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Check-In</p>
                <p className="text-xs text-muted-foreground/70">Video call with coach</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary tracking-tight">{daysUntilCheckIn}</p>
              <p className="text-xs font-medium text-muted-foreground">days left</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-3 rounded-full bg-primary/20 overflow-hidden">
              <div 
                className="h-full rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${cycleProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Day {15 - daysUntilCheckIn} of 15</span>
              <span className="font-semibold text-primary">{Math.round(cycleProgress)}% complete</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* What to prepare */}
      <div className="px-6 pb-4">
        <p className="text-sm font-bold text-foreground mb-4">What to prepare</p>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Progress Update</p>
              <p className="text-xs text-muted-foreground mt-0.5">Share your wins and challenges</p>
            </div>
            <div className="shrink-0 w-2 h-2 rounded-full bg-primary/50" />
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all">
            <div className="p-2.5 rounded-xl bg-secondary/15">
              <Video className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Video Call</p>
              <p className="text-xs text-muted-foreground mt-0.5">30-min session with Dr. Rashmi</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              30 min
            </div>
          </div>
        </div>
      </div>
      
      {/* Schedule CTA */}
      <div className="px-6 pb-6">
        <Button className="w-full h-14 rounded-2xl gradient-accent text-accent-foreground font-semibold text-base hover:opacity-90 transition-all shine">
          <Sparkles className="h-5 w-5 mr-3" />
          Schedule Check-In Call
        </Button>
      </div>
    </div>
  )
}
