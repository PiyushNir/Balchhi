"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useHook } from "@/contexts/hook-context"

export default function FishingHook() {
  const prefersReducedMotion = useReducedMotion()
  const [reducedMotion, setReducedMotion] = useState(false)
  const [hookBottom, setHookBottom] = useState(0) // Where the hook ends (bottom of hook)
  const [isAnimationDone, setIsAnimationDone] = useState(false)
  const [isPastHero, setIsPastHero] = useState(false)
  const [stringCurve, setStringCurve] = useState(0) // Curve offset for bounce effect
  const { updateHookPosition } = useHook()
  
  // Refs for animation state
  const stateRef = useRef({
    animationDone: false,
    currentBottom: 0,
    targetBottom: 0,
    maxLength: 300,
    curveAmount: 0,
  })

  useEffect(() => {
    setReducedMotion(prefersReducedMotion ?? false)
  }, [prefersReducedMotion])

  useEffect(() => {
    stateRef.current.maxLength = window.innerHeight * 0.35
    const targetLength = stateRef.current.maxLength
    
    // Very fast drop animation - 500ms (half a second)
    const duration = 500
    const startTime = performance.now()
    let rafId: number
    
    const initialAnimation = () => {
      const now = performance.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing with bounce at the end
      let eased
      let curve = 0
      if (progress < 0.6) {
        // Fast ease-out for the main drop
        eased = 1 - Math.pow(1 - progress / 0.6, 3)
      } else {
        // Bounce phase with string curve
        const bounceProgress = (progress - 0.7) / 0.3
        // Damped oscillation for bounce
        const bounce = Math.sin(bounceProgress * Math.PI * 2.5) * Math.exp(-bounceProgress * 3)
        eased = 1 + bounce * 0.04
        // Curve the string during bounce - oscillates side to side
        curve = Math.sin(bounceProgress * Math.PI * 2.5) * Math.exp(-bounceProgress * 2) * 25
      }
      
      // Hook bottom position during animation (just the drop, no scroll yet)
      const currentBottom = targetLength * eased
      stateRef.current.currentBottom = currentBottom
      stateRef.current.curveAmount = curve
      setHookBottom(currentBottom)
      setStringCurve(curve)
      
      // Broadcast hook position (hook tip is at bottom of the container)
      const hookXPos = window.innerWidth * (window.innerWidth >= 768 ? 0.12 : 0.10)
      updateHookPosition({ x: hookXPos, y: currentBottom })
      
      // Check if should be white - only when hook reaches the water (around 85% of viewport)
      setIsPastHero(currentBottom > window.innerHeight * 0.85)
      
      if (progress < 1) {
        rafId = requestAnimationFrame(initialAnimation)
      } else {
        stateRef.current.animationDone = true
        stateRef.current.currentBottom = targetLength
        setIsAnimationDone(true)
        // Start the lagging scroll follow
        rafId = requestAnimationFrame(lagFollow)
      }
    }
    
    // Lagging follow - the hook bottom follows scroll with lag
    // Extends by a portion of scroll, capped at a reasonable max
    const lagFollow = () => {
      // Add 10% of scroll distance, max 200px extra length
      const scrollContribution = Math.min(window.scrollY * 0.1, 200)
      const target = stateRef.current.maxLength + scrollContribution
      const current = stateRef.current.currentBottom
      
      // Lerp - move 5% closer to target each frame
      const lerp = 0.05
      const newBottom = current + (target - current) * lerp
      
      stateRef.current.currentBottom = newBottom
      setHookBottom(newBottom)
      
      // Broadcast hook position (hook tip is at bottom of the container)
      const hookXPos = window.innerWidth * (window.innerWidth >= 768 ? 0.12 : 0.10)
      updateHookPosition({ x: hookXPos, y: newBottom })
      
      // Change to white when scrolled enough that hook enters dark water section
      // Water starts at ~85% of hero viewport, so trigger when scroll puts hook into water
      setIsPastHero(window.scrollY > window.innerHeight * 0.6)
      
      rafId = requestAnimationFrame(lagFollow)
    }
    
    // Start initial animation
    rafId = requestAnimationFrame(initialAnimation)
    
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  const strokeColor = isPastHero ? '#FFFFFF' : '#2B2B2B'

  return (
    <div
      className="fixed left-[10%] md:left-[12%] pointer-events-none overflow-visible"
      style={{ 
        zIndex: 9999,
        top: 0,
        height: hookBottom,
      }}
    >
      {/* Fishing line - curved SVG path for bounce effect */}
      <svg 
        className="absolute top-0 left-1/2 -translate-x-1/2 overflow-visible"
        style={{ 
          width: '60px',
          height: 'calc(100% - 20px)',
        }}
        preserveAspectRatio="none"
      >
        <path
          d={`M 30 0 Q ${30 + stringCurve} ${(hookBottom - 20) / 2} 30 ${hookBottom - 20}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          className="transition-colors duration-1000"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      {/* Hook SVG at the bottom */}
      <motion.svg 
        className="absolute left-1/2 -translate-x-1/2 w-16 h-24 md:w-20 md:h-28 overflow-visible"
        style={{ top: 'calc(100% - 80px)' }}
        viewBox="0 0 40 64"
        overflow="visible"
        animate={isAnimationDone && !reducedMotion ? { rotate: [-2, 2, -2] } : {}}
        transition={{ 
          rotate: {
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut"
          }
        }}
      >
        {/* Hook eye (loop at top) */}
        <circle
          cx="20"
          cy="8"
          r="5"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          className="transition-colors duration-1000"
        />
        {/* Hook stem */}
        <path
          d="M20,13 L20,40 Q20,55 10,55 Q0,55 0,45 Q0,35 10,35"
          fill="none"
          stroke={strokeColor}
          strokeWidth="5"
          strokeLinecap="round"
          className="transition-colors duration-1000"
        />
        {/* Hook point */}
        <path
          d="M10,35 L16,28"
          fill="none"
          stroke={strokeColor}
          strokeWidth="5"
          strokeLinecap="round"
          className="transition-colors duration-1000"
        />
      </motion.svg>
    </div>
  )
}