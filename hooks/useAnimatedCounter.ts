"use client"

import { useState, useEffect } from 'react'

// Custom easeOutExpo function for smooth number animation
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function useAnimatedCounter(
  target: number, 
  duration: number = 1400,
  decimals: number = 0
): number {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use easeOutExpo for smooth deceleration
      const easedProgress = easeOutExpo(progress)
      const currentValue = easedProgress * target
      
      if (decimals > 0) {
        setCount(parseFloat(currentValue.toFixed(decimals)))
      } else {
        setCount(Math.floor(currentValue))
      }
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    
    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [target, duration, decimals])
  
  return count
}

export default useAnimatedCounter
