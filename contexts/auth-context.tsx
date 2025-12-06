"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"

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
  session: Session | null
  isLoading: boolean
  isEmailConfirmed: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        
        if (currentSession) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single()
          
          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role || 'individual',
              createdAt: new Date(profile.created_at),
            })
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession)
      
      if (currentSession?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()
        
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role || 'individual',
            createdAt: new Date(profile.created_at),
          })
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      
      setSession(data.session)
      
      // Fetch user profile
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role || 'individual',
            createdAt: new Date(profile.created_at),
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true)
    try {
      // Call our API endpoint to handle signup
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        // If user already exists, try to log them in instead
        if (error.error?.includes('already registered') || error.error?.includes('already been')) {
          await login(email, password)
          return
        }
        throw new Error(error.error || 'Failed to create account')
      }

      const { user: newUserData } = await response.json()

      // Automatically log in
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) throw loginError

      if (loginData.session) {
        setSession(loginData.session)
        setIsEmailConfirmed(true)

        const newUser: User = {
          id: newUserData.id,
          email: newUserData.email,
          name: newUserData.name,
          role: newUserData.role as UserRole,
          createdAt: new Date(),
        }
        setUser(newUser)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isEmailConfirmed, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

