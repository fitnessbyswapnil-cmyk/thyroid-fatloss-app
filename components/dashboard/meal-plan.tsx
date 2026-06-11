"use client"

import { ChevronRight, Clock, Flame, Check, Leaf, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const meals = [
  {
    time: "7:30 AM",
    name: "Thyroid-Friendly Breakfast",
    description: "Overnight oats with selenium-rich Brazil nuts, berries, and flaxseeds",
    calories: 380,
    completed: true,
  },
  {
    time: "10:30 AM",
    name: "Morning Snack",
    description: "Greek yogurt with walnuts and honey",
    calories: 180,
    completed: true,
  },
  {
    time: "1:00 PM",
    name: "Balanced Lunch",
    description: "Grilled chicken with quinoa and steamed vegetables",
    calories: 450,
    completed: false,
  },
  {
    time: "4:00 PM",
    name: "Evening Snack",
    description: "Green smoothie with spinach and coconut water",
    calories: 150,
    completed: false,
  },
  {
    time: "7:30 PM",
    name: "Light Dinner",
    description: "Baked salmon with sweet potato and sauteed greens",
    calories: 420,
    completed: false,
  },
]

export function MealPlan() {
  const completedMeals = meals.filter(m => m.completed).length
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
  const consumedCalories = meals.filter(m => m.completed).reduce((sum, m) => sum + m.calories, 0)
  
  return (
    <div className="premium-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Today&apos;s Meal Plan</h3>
            <p className="text-xs text-muted-foreground mt-1">{completedMeals} of {meals.length} meals completed</p>
          </div>
          <Button variant="ghost" className="text-primary text-sm font-medium h-9 px-3 rounded-xl hover:bg-primary/5">
            Full Plan <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* Calories overview card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary/15 via-secondary/10 to-secondary/5 border border-secondary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-secondary/20">
                <Flame className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{consumedCalories} <span className="text-sm font-medium text-muted-foreground">/ {totalCalories}</span></p>
                <p className="text-xs text-muted-foreground">Calories consumed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 border border-secondary/30">
              <Leaf className="h-3.5 w-3.5 text-secondary" />
              <span className="text-xs font-semibold text-secondary">Thyroid Optimized</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-secondary/20 overflow-hidden">
            <div 
              className="h-full rounded-full gradient-secondary transition-all duration-500"
              style={{ width: `${(consumedCalories / totalCalories) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Meals list */}
      <div className="px-6 pb-6 space-y-3">
        {meals.map((meal, index) => (
          <div 
            key={index}
            className={cn(
              "group relative flex items-start gap-4 p-4 rounded-2xl transition-all duration-300",
              meal.completed 
                ? "bg-muted/30" 
                : "bg-card hover:bg-muted/20 border border-transparent hover:border-border/50"
            )}
          >
            {/* Status indicator */}
            <div className={cn(
              "shrink-0 mt-0.5 p-2 rounded-xl transition-all duration-300",
              meal.completed 
                ? "bg-secondary text-secondary-foreground shadow-md" 
                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              {meal.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">{meal.time}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="text-xs font-medium text-muted-foreground">{meal.calories} kcal</span>
              </div>
              <p className={cn(
                "text-sm font-semibold transition-all",
                meal.completed ? "text-muted-foreground" : "text-foreground"
              )}>
                {meal.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {meal.description}
              </p>
            </div>
            
            {/* Completed badge */}
            {meal.completed && (
              <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/15 text-secondary">
                <Sparkles className="h-3 w-3" />
                <span className="text-xs font-semibold">Done</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
