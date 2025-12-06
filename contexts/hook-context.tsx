"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface HookPosition {
  x: number
  y: number // bottom position of hook
}

interface CaughtItem {
  id: string
  offsetX: number
  offsetY: number
}

interface HookContextType {
  hookPosition: HookPosition
  updateHookPosition: (pos: HookPosition) => void
  caughtItems: CaughtItem[]
  catchItem: (id: string, offsetX: number, offsetY: number) => void
  isItemCaught: (id: string) => boolean
  getItemOffset: (id: string) => { offsetX: number; offsetY: number } | null
}

const HookContext = createContext<HookContextType | null>(null)

export function HookProvider({ children }: { children: ReactNode }) {
  const [hookPosition, setHookPosition] = useState<HookPosition>({ x: 0, y: 0 })
  const [caughtItems, setCaughtItems] = useState<CaughtItem[]>([])

  const updateHookPosition = useCallback((pos: HookPosition) => {
    setHookPosition(pos)
  }, [])

  const catchItem = useCallback((id: string, offsetX: number, offsetY: number) => {
    setCaughtItems(prev => {
      if (prev.find(item => item.id === id)) return prev
      return [...prev, { id, offsetX, offsetY }]
    })
  }, [])

  const isItemCaught = useCallback((id: string) => {
    return caughtItems.some(item => item.id === id)
  }, [caughtItems])

  const getItemOffset = useCallback((id: string) => {
    const item = caughtItems.find(i => i.id === id)
    return item ? { offsetX: item.offsetX, offsetY: item.offsetY } : null
  }, [caughtItems])

  return (
    <HookContext.Provider value={{ 
      hookPosition, 
      updateHookPosition, 
      caughtItems, 
      catchItem,
      isItemCaught,
      getItemOffset
    }}>
      {children}
    </HookContext.Provider>
  )
}

export function useHook() {
  const context = useContext(HookContext)
  if (!context) {
    throw new Error("useHook must be used within a HookProvider")
  }
  return context
}
