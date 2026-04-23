"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

// Lazy-load the Supabase client to defer its ~196KB bundle from the critical
// hydration path.  The client is only needed after mount (useEffect), so the
// dynamic import runs in parallel with React hydration instead of blocking it.
const getClient = () => import("@/lib/supabase/client").then(m => m.createClient())

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    // Lazy-load Supabase client — its ~196KB JS bundle loads in parallel
    // with React hydration instead of blocking TBT.
    getClient()
      .then(async (supabase) => {
        if (cancelled) return

        // Two-step auth check to avoid unnecessary network calls:
        // 1. getSession() reads from local storage (no network)
        // 2. If a session exists, getUser() validates against the server
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (cancelled) return

          if (!session) {
            setUser(null)
            setIsLoading(false)
            return
          }

          const { data: { user }, error } = await supabase.auth.getUser()
          if (cancelled) return
          if (error) {
            await supabase.auth.signOut()
            setUser(null)
          } else {
            setUser(user ?? null)
          }
        } catch (error) {
          console.error("Error getting user:", error)
          if (!cancelled) setUser(null)
        } finally {
          if (!cancelled) setIsLoading(false)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (!cancelled) {
              setUser(session?.user ?? null)
              setIsLoading(false)
            }
          }
        )
        unsubscribe = () => subscription.unsubscribe()
      })
      .catch(() => {
        // Supabase credentials not configured — auth features disabled.
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const signOut = async () => {
    try {
      const supabase = await getClient()
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
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
