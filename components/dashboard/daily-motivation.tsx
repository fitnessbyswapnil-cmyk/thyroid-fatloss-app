"use client"

import { useState } from "react"
import { Heart, Sparkles, Share2, BookmarkPlus, RefreshCw, Quote, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

const motivations = [
  {
    quote: "Every cell in your body is working to heal. Trust the process, honor your journey.",
    author: "Dr. Rashmi Sharma",
    category: "Healing",
  },
  {
    quote: "Your thyroid doesn't define you. Your courage and consistency do.",
    author: "ThyroWell Team",
    category: "Strength",
  },
  {
    quote: "Small steps today create massive transformation tomorrow. You're doing amazing.",
    author: "Your Coach",
    category: "Progress",
  },
]

export function DailyMotivation() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const motivation = motivations[currentIndex]
  
  const nextMotivation = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % motivations.length)
      setLiked(false)
      setSaved(false)
      setIsAnimating(false)
    }, 300)
  }
  
  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Cinematic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f6f3] via-[#faf8f5] to-[#f5f3f0]" />
      
      {/* Ambient light effects */}
      <div className="absolute top-0 left-1/4 w-48 h-48 bg-accent/20 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-40 h-40 bg-secondary/15 rounded-full blur-[50px] pointer-events-none" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20">
                <Sun className="h-5 w-5 text-accent-foreground" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-accent/20 blur-lg -z-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">Daily Intention</h3>
              <p className="text-xs text-muted-foreground">Personalized for your journey</p>
            </div>
          </div>
          
          <div className="px-3 py-1.5 rounded-full bg-secondary/15 border border-secondary/20">
            <span className="text-xs font-semibold text-secondary">{motivation.category}</span>
          </div>
        </div>
        
        {/* Quote card */}
        <div 
          className={cn(
            "relative p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-lg transition-all duration-300",
            isAnimating && "opacity-0 scale-95"
          )}
        >
          {/* Quote icon */}
          <div className="absolute -top-3 -left-2">
            <Quote className="h-8 w-8 text-primary/20 fill-primary/10" />
          </div>
          
          <p className="text-lg font-medium text-foreground leading-relaxed tracking-tight text-balance pl-4">
            &quot;{motivation.quote}&quot;
          </p>
          
          <div className="flex items-center gap-2 mt-4 pl-4">
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <span className="text-xs font-semibold text-muted-foreground">
              {motivation.author}
            </span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300",
                liked 
                  ? "bg-rose-100 text-rose-600 scale-105" 
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <Heart className={cn("h-4 w-4 transition-all", liked && "fill-current scale-110")} />
              <span className="text-xs font-semibold">{liked ? "Loved" : "Love"}</span>
            </button>
            
            <button
              onClick={() => setSaved(!saved)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300",
                saved 
                  ? "bg-primary/15 text-primary scale-105" 
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <BookmarkPlus className={cn("h-4 w-4 transition-all", saved && "fill-current scale-110")} />
              <span className="text-xs font-semibold">{saved ? "Saved" : "Save"}</span>
            </button>
            
            <button className="p-2.5 rounded-2xl bg-muted/60 text-muted-foreground hover:bg-muted transition-all duration-300">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={nextMotivation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary/15 to-secondary/15 text-primary hover:from-primary/20 hover:to-secondary/20 transition-all duration-300"
          >
            <RefreshCw className={cn("h-4 w-4 transition-all", isAnimating && "animate-spin")} />
            <span className="text-xs font-semibold">New Quote</span>
          </button>
        </div>
        
        {/* Streak info */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/15">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-secondary" />
            <p className="text-sm text-foreground">
              <span className="font-bold">19 days</span> of reading daily intentions. Keep the healing momentum!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
