"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { useHook } from "@/contexts/hook-context"

// Shared Catchable Floating Item Component
// Used by both hero.tsx and landing-sections.tsx to avoid code duplication
interface CatchableItemProps {
  id: string
  children: React.ReactNode
  initialPosition?: { left?: string; right?: string; bottom?: string; top?: string }
  style?: React.CSSProperties
  floatAnimation?: { y: number[]; rotate: number[] }
  floatDuration?: number
  floatDelay?: number
  className?: string
  collisionRadius?: number // Default 80 for hero, 100 for underwater sections
  underwaterOpacity?: number // Opacity when floating (0-1), default 0.6 for underwater effect
}

export function CatchableFloatingItem({ 
  id, 
  children, 
  initialPosition,
  style = {},
  floatAnimation = { y: [0, -8, 0], rotate: [-2, 2, -2] },
  floatDuration = 4,
  floatDelay = 0,
  className = "",
  collisionRadius = 80,
  underwaterOpacity = 0.6
}: CatchableItemProps) {
  const { hookPosition, catchItem, isItemCaught, getItemOffset } = useHook()
  const itemRef = useRef<HTMLDivElement>(null)
  const [isCaught, setIsCaught] = useState(false)
  const [caughtPosition, setCaughtPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Check for collision with hook
  useEffect(() => {
    if (isCaught || isItemCaught(id)) {
      setIsCaught(true)
      return
    }
    
    if (!itemRef.current) return
    
    const rect = itemRef.current.getBoundingClientRect()
    const itemCenterX = rect.left + rect.width / 2
    const itemCenterY = rect.top + rect.height / 2
    
    const hookTipX = hookPosition.x
    const hookTipY = hookPosition.y
    
    // Check collision distance
    const distance = Math.sqrt(
      Math.pow(hookTipX - itemCenterX, 2) + 
      Math.pow(hookTipY - itemCenterY, 2)
    )
    
    if (distance < collisionRadius && hookPosition.y > 100) {
      setIsCaught(true)
      const offsetX = itemCenterX - hookTipX
      const offsetY = itemCenterY - hookTipY
      catchItem(id, offsetX, offsetY)
      setCaughtPosition({ x: offsetX, y: offsetY })
    }
  }, [hookPosition, id, isCaught, catchItem, isItemCaught, collisionRadius])
  
  // Restore caught state from context
  useEffect(() => {
    const offset = getItemOffset(id)
    if (offset && !caughtPosition) {
      setIsCaught(true)
      setCaughtPosition({ x: offset.offsetX, y: offset.offsetY })
    }
  }, [id, getItemOffset, caughtPosition])
  
  // Caught state - follow the hook (fully opaque when out of water)
  if (isCaught && caughtPosition) {
    return (
      <motion.div
        className={`fixed z-[9998] pointer-events-none ${className}`}
        style={{
          left: hookPosition.x - 40,
          top: hookPosition.y - 10,
          opacity: 1, // Fully opaque when caught/out of water
        }}
        animate={{ 
          rotate: [-5, 5, -5],
          scale: [1, 1.02, 1]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        {children}
      </motion.div>
    )
  }
  
  // Normal floating state (opacity controlled by underwaterOpacity prop)
  const positionStyle: React.CSSProperties = { ...style }
  if (initialPosition) {
    if (initialPosition.bottom) positionStyle.bottom = initialPosition.bottom
    if (initialPosition.top) positionStyle.top = initialPosition.top
    if (initialPosition.left) positionStyle.left = initialPosition.left
    if (initialPosition.right) positionStyle.right = initialPosition.right
  }
  
  return (
    <motion.div
      ref={itemRef}
      className={`absolute z-10 pointer-events-none ${className}`}
      style={{
        ...positionStyle,
        opacity: underwaterOpacity, // Use prop for opacity (1 = above water, 0.6 = underwater)
      }}
      animate={floatAnimation}
      transition={{ 
        duration: floatDuration, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay: floatDelay
      }}
    >
      {children}
    </motion.div>
  )
}

