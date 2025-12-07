"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface PageTransitionContextType {
  isTransitioning: boolean
  navigateTo: (path: string) => void
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  isTransitioning: false,
  navigateTo: () => {},
})

export const usePageTransition = () => useContext(PageTransitionContext)

// Submarine SVG Component
const Submarine = () => (
  <svg
    width="120"
    height="60"
    viewBox="0 0 120 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="submarine"
  >
    {/* Main body */}
    <ellipse cx="60" cy="35" rx="45" ry="18" fill="#F4D03F" />
    
    {/* Conning tower (sail) */}
    <rect x="45" y="12" width="25" height="23" rx="4" fill="#F4D03F" />
    
    {/* Periscope */}
    <rect x="55" y="2" width="4" height="12" rx="2" fill="#D4AC0D" />
    <circle cx="57" cy="4" r="3" fill="#D4AC0D" />
    
    {/* Windows/Portholes */}
    <circle cx="35" cy="35" r="5" fill="#87CEEB" stroke="#B7950B" strokeWidth="2" />
    <circle cx="55" cy="35" r="5" fill="#87CEEB" stroke="#B7950B" strokeWidth="2" />
    <circle cx="75" cy="35" r="5" fill="#87CEEB" stroke="#B7950B" strokeWidth="2" />
    
    {/* Propeller */}
    <ellipse cx="108" cy="35" rx="3" ry="10" fill="#D4AC0D" className="propeller" />
    
    {/* Front light */}
    <circle cx="18" cy="35" r="4" fill="#FFD700" className="light-glow" />
    
    {/* Bubbles */}
    <g className="bubbles">
      <circle cx="115" cy="30" r="3" fill="rgba(255,255,255,0.6)" className="bubble bubble-1" />
      <circle cx="118" cy="38" r="2" fill="rgba(255,255,255,0.5)" className="bubble bubble-2" />
      <circle cx="116" cy="42" r="2.5" fill="rgba(255,255,255,0.4)" className="bubble bubble-3" />
    </g>
  </svg>
)

// Water Wave Component
const WaterWave = ({ delay = 0, bottom = 0 }: { delay?: number; bottom?: number }) => (
  <motion.div
    className="water-wave"
    initial={{ y: "100%" }}
    animate={{ y: "0%" }}
    exit={{ y: "-100%" }}
    transition={{
      duration: 0.35,
      delay: delay * 0.6,
      ease: [0.4, 0, 0.2, 1],
    }}
    style={{
      position: "absolute",
      bottom: `${bottom}%`,
      left: 0,
      right: 0,
      height: "35%",
      background: `linear-gradient(180deg, 
        rgba(60, 60, 60, 0.95) 0%, 
        rgba(50, 50, 50, 0.97) 30%,
        rgba(43, 43, 43, 0.98) 60%,
        rgba(35, 35, 35, 1) 100%)`,
      zIndex: 9999,
    }}
  />
)

// Floating particles (fish, seaweed, etc.)
const UnderwaterParticles = () => (
  <div className="underwater-particles">
    {/* Swimming fish - animated across screen */}
    {[...Array(8)].map((_, i) => (
      <div
        key={`fish-${i}`}
        className={`swimming-fish ${i % 2 === 0 ? 'fish-left' : 'fish-right'}`}
        style={{
          top: `${15 + (i % 5) * 15}%`,
          animationDelay: `${i * 0.2}s`,
          animationDuration: `${2 + (i % 3) * 0.5}s`,
          fontSize: `${18 + (i % 3) * 6}px`,
        }}
      >
        {i % 3 === 0 ? '🐠' : i % 3 === 1 ? '🐟' : '🐡'}
      </div>
    ))}
    {/* Seaweed at bottom */}
    {[...Array(6)].map((_, i) => (
      <div
        key={`seaweed-${i}`}
        className="seaweed"
        style={{
          left: `${8 + i * 18}%`,
          animationDelay: `${i * 0.3}s`,
        }}
      >
        🌿
      </div>
    ))}
    {/* Bubbles */}
    {[...Array(12)].map((_, i) => (
      <div
        key={`bubble-${i}`}
        className="floating-bubble"
        style={{
          left: `${5 + i * 8}%`,
          animationDelay: `${i * 0.2}s`,
          animationDuration: `${2 + (i % 3)}s`,
        }}
      />
    ))}
  </div>
)

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const navigateTo = useCallback((path: string) => {
    if (path === pathname || isTransitioning) return
    
    setPendingPath(path)
    setIsTransitioning(true)
    setShowContent(true)
  }, [pathname, isTransitioning])

  useEffect(() => {
    if (!isTransitioning || !pendingPath) return

    // Phase 1: Water floods in (0-300ms)
    // Phase 2: Submarines float (visible during transition)
    // Phase 3: Navigate and water recedes

    const hideContentTimeout = setTimeout(() => {
      setShowContent(false)
    }, 250)

    const navigateTimeout = setTimeout(() => {
      router.push(pendingPath)
    }, 1000)

    const endTimeout = setTimeout(() => {
      setIsTransitioning(false)
      setPendingPath(null)
      setShowContent(true)
    }, 1400)

    return () => {
      clearTimeout(hideContentTimeout)
      clearTimeout(navigateTimeout)
      clearTimeout(endTimeout)
    }
  }, [isTransitioning, pendingPath, router])

  return (
    <PageTransitionContext.Provider value={{ isTransitioning, navigateTo }}>
      <div className="page-transition-wrapper">
        {/* Main content */}
        <motion.div
          animate={{ 
            opacity: showContent ? 1 : 0,
            scale: showContent ? 1 : 0.95,
          }}
          transition={{ duration: 0.3 }}
          style={{ minHeight: "100vh" }}
        >
          {children}
        </motion.div>

        {/* Transition overlay */}
        <AnimatePresence>
          {isTransitioning && (
            <div className="transition-overlay">
              {/* Water waves flooding from bottom */}
              <WaterWave delay={0} bottom={0} />
              <WaterWave delay={0.1} bottom={30} />
              <WaterWave delay={0.2} bottom={60} />
              
              {/* Underwater atmosphere */}
              <motion.div
                className="underwater-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.15 }}
              >
                {/* Caustics/light rays effect */}
                <div className="caustics" />
                
                {/* Underwater particles */}
                <UnderwaterParticles />
                
                {/* Submarines - floating in place with gentle movement */}
                <motion.div
                  className="submarine-floating"
                  style={{ left: '15%', top: '35%' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <motion.div
                    animate={{ y: [0, -6, 0, 6, 0], x: [0, 3, 0, -3, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Submarine />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="submarine-floating"
                  style={{ left: '55%', top: '50%', transform: 'scale(0.8)' }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 0.8, scale: 0.8 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  <motion.div
                    animate={{ y: [0, 8, 0, -8, 0], x: [0, -4, 0, 4, 0] }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  >
                    <Submarine />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="submarine-floating"
                  style={{ left: '75%', top: '25%', transform: 'scale(0.6)' }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 0.6, scale: 0.6 }}
                  transition={{ delay: 0.45, duration: 0.3 }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0, 5, 0], x: [0, 2, 0, -2, 0] }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  >
                    <Submarine />
                  </motion.div>
                </motion.div>

                {/* Loading text */}
                <motion.div
                  className="loading-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <span className="loading-dots">Diving deep</span>
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransitionContext.Provider>
  )
}

// Custom Link component that uses the transition
export function TransitionLink({
  href,
  children,
  className,
  ...props
}: {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const { navigateTo, isTransitioning } = usePageTransition()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isTransitioning) {
      navigateTo(href)
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={{ cursor: isTransitioning ? "wait" : "pointer" }}
      {...props}
    >
      {children}
    </a>
  )
}
