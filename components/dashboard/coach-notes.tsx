"use client"

import { MessageSquare, Heart, ChevronRight, Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const notes = [
  {
    date: "Today",
    message: "Amazing progress this week! Your energy levels have improved significantly. Keep focusing on your morning routine - it's making a real difference. Remember to take your supplements 30 mins before breakfast.",
    isNew: true,
  },
  {
    date: "3 days ago",
    message: "Great job maintaining your water intake! I've noticed your sleep quality improving. Let's discuss adding some gentle yoga to your routine in our next call.",
    isNew: false,
  },
]

export function CoachNotes() {
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20 ring-offset-2 ring-offset-card shadow-lg">
                <AvatarImage src="" alt="Coach" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-base">
                  DR
                </AvatarFallback>
              </Avatar>
              {/* Verified badge */}
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-secondary border-2 border-card">
                <Sparkles className="h-3 w-3 text-secondary-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">Coach Notes</h3>
              <p className="text-sm text-muted-foreground">Dr. Rashmi Sharma</p>
              <p className="text-xs text-secondary font-medium mt-0.5">Thyroid Specialist</p>
            </div>
          </div>
          <Button variant="ghost" className="text-primary text-sm font-medium h-9 px-3 rounded-xl hover:bg-primary/5">
            All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Notes */}
      <div className="px-6 pb-4 space-y-4">
        {notes.map((note, index) => (
          <div 
            key={index} 
            className={cn(
              "relative p-5 rounded-2xl transition-all duration-300",
              note.isNew 
                ? "bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/20" 
                : "bg-muted/30"
            )}
          >
            {/* New badge */}
            {note.isNew && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs font-semibold text-primary">New</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-muted-foreground">{note.date}</span>
            </div>
            
            <p className="text-sm text-foreground leading-relaxed pr-16">{note.message}</p>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-4 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl"
              >
                <Heart className="h-4 w-4 mr-2" />
                Thank You
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-4 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Reply
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick message CTA */}
      <div className="px-6 pb-6">
        <Button className="w-full h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-base shine">
          <Send className="h-5 w-5 mr-3" />
          Message Your Coach
        </Button>
      </div>
    </div>
  )
}
