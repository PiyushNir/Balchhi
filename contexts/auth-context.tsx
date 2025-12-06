"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type UserRole = "individual" | "organization" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("khojpayo-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const mockUser: User = {
        id: Math.random().toString(36).substring(7),
        email,
        name: email.split("@")[0],
        role: "individual",
        createdAt: new Date(),
      }
      setUser(mockUser)
      localStorage.setItem("khojpayo-user", JSON.stringify(mockUser))
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true)
    try {
      const newUser: User = {
        id: Math.random().toString(36).substring(7),
        email,
        name,
        role,
        createdAt: new Date(),
      }
      setUser(newUser)
      localStorage.setItem("khojpayo-user", JSON.stringify(newUser))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("khojpayo-user")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

