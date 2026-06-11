"use client"

import { motion } from "framer-motion"

interface CoachInsightCardProps {
  coachName?: string
  coachRole?: string
  insight?: string
  timestamp?: string
  isNew?: boolean
}

export function CoachInsightCard({ 
  coachName = "Your Coach",
  coachRole = "Wellness coach · Reviewing your week",
  insight = "Amazing progress this week! Your energy levels have improved significantly. Keep focusing on your morning routine - it's making a real difference. Remember to take your supplements 30 mins before breakfast.",
  timestamp = "Today · 9:14 AM",
  isNew = true
}: CoachInsightCardProps) {
  // Split insight into segments for staggered reveal
  const segments = insight.split(/(?<=[.!?])\s+/).filter(s => s.length > 0)
  
  const containerVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.65, 
        ease: [0.22, 1, 0.36, 1],
        delay: 1.1
      }
    }
  }
  
  const textContainerVariants = {
    hidden: {},
    visible: {
      transition: { 
        staggerChildren: 0.09,
        delayChildren: 0.3
      }
    }
  }
  
  const lineVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="relative mx-4 overflow-hidden"
      style={{
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(45, 212, 191, 0.15)',
        borderRadius: 28,
        padding: '26px 22px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 28px 70px rgba(0, 0, 0, 0.35), 0 4px 20px rgba(45, 212, 191, 0.08)',
      }}
    >
      {/* Specular highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
        }}
      />
      
      {/* Gradient tint overlay */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.05) 0%, transparent 55%)',
        }}
      />
      
      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Coach Avatar with active indicator */}
            <div className="relative">
              <div 
                className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden"
                style={{ border: '2px solid #2dd4bf' }}
              >
                <span className="text-lg font-semibold">R</span>
              </div>
              {/* Active indicator dot with pulse */}
              <motion.div 
                className="absolute -bottom-0.5 -right-0.5 rounded-full"
                style={{ 
                  width: 9,
                  height: 9,
                  background: '#34d399',
                  border: '2px solid #090c14'
                }}
                animate={{ 
                  scale: [1, 1.5, 1], 
                  opacity: [1, 0.5, 1] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            
            <div>
              <p 
                className="text-[14px] font-semibold"
                style={{ color: '#eaecf4' }}
              >
                {coachName}
              </p>
              <p 
                className="text-[12px]"
                style={{ color: '#2dd4bf' }}
              >
                {coachRole}
              </p>
            </div>
          </div>
          
          {/* Coach Insight Badge */}
          <div 
            className="px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(45, 212, 191, 0.12)',
            }}
          >
            <span 
              className="text-[10px] font-medium uppercase"
              style={{ color: '#2dd4bf', letterSpacing: '0.08em' }}
            >
              Coach Insight
            </span>
          </div>
        </div>
        
        {/* Divider */}
        <div 
          className="w-full h-px my-3.5"
          style={{ background: 'rgba(255, 255, 255, 0.07)' }}
        />
        
        {/* Insight Text with staggered segments */}
        <motion.div 
          className="mb-4"
          variants={textContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {segments.map((segment, index) => (
            <motion.span
              key={index}
              variants={lineVariants}
              className="inline"
              style={{
                color: '#eaecf4',
                fontSize: 15,
                lineHeight: 1.75,
              }}
            >
              {segment}{' '}
            </motion.span>
          ))}
        </motion.div>
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <p 
            className="text-[13px]"
            style={{ 
              color: '#7e8a9e', 
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic'
            }}
          >
            — {coachName}
          </p>
          <div className="flex items-center gap-2">
            <span 
              className="text-[11px]"
              style={{ color: '#404858' }}
            >
              {timestamp}
            </span>
            {isNew && (
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ 
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b'
                }}
              >
                NEW
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
