"use client"

import { motion } from "framer-motion"
import { Bell, Settings, Crown, Sparkles, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  userName: string
  userImage?: string
}

export function Header({ userName, userImage }: HeaderProps) {
  const firstName = userName.split(" ")[0]
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase()
  const greeting = getGreeting()
  
  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }
  
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [.22,1,.36,1] }}
      className="sticky top-0 z-50"
    >
      {/* Premium frosted glass background */}
      <div className="absolute inset-0 bg-[#F7F4EE]/90 backdrop-blur-2xl border-b border-border/20" />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent" />
      
      <div className="relative px-5 py-4">
        <div className="flex items-center justify-between">
          {/* User info */}
          <motion.div 
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [.22,1,.36,1] }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <Avatar className="h-14 w-14 ring-[3px] ring-primary/12 ring-offset-[3px] ring-offset-[#F7F4EE] shadow-xl">
                <AvatarImage src={userImage} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground font-bold text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Premium crown badge with glow */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
                className="absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full bg-gradient-to-br from-accent to-accent/80 border-[2.5px] border-[#F7F4EE] shadow-lg"
                style={{ boxShadow: '0 4px 12px oklch(0.82 0.12 80 / 0.4)' }}
              >
                <Crown className="h-2.5 w-2.5 text-accent-foreground" />
              </motion.div>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground font-semibold tracking-wide">{greeting},</p>
              <h1 className="text-[22px] font-bold text-foreground tracking-tight">{firstName}</h1>
            </div>
          </motion.div>
          
          {/* Action buttons */}
          <motion.div 
            initial={{ x: 15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [.22,1,.36,1] }}
            className="flex items-center gap-2.5"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-12 w-12 rounded-2xl bg-white/80 hover:bg-white border border-border/30 shadow-sm transition-all duration-500"
              >
                <Bell className="h-5 w-5 text-foreground" />
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-12 w-12 rounded-2xl bg-white/80 hover:bg-white border border-border/30 shadow-sm transition-all duration-500"
              >
                <Settings className="h-5 w-5 text-foreground" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Premium membership bar */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [.22,1,.36,1] }}
          className="mt-4"
        >
          <motion.button 
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-primary/8 via-secondary/6 to-accent/8 border border-primary/10 hover:border-primary/18 transition-all duration-500 group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-foreground tracking-tight">Premium Recovery Plan</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Week 8 of 12 - 67% complete</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-500" />
          </motion.button>
        </motion.div>
      </div>
    </motion.header>
  )
}
