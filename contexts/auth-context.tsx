"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

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
    let supabase: SupabaseClient | null = null
    try {
      supabase = createClient()
    } catch (error) {
      console.error("Failed to initialize auth client:", error)
      setIsLoading(false)
      return
    }

    // Two-step auth check to avoid unnecessary network calls:
    // 1. getSession() reads from local storage (no network request) — if there's
    //    no session, we know the visitor is unauthenticated and can skip the server call.
    // 2. If a session exists, we call getUser() to server-validate it, ensuring
    //    stale or cross-project tokens are caught and cleared.
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession()

        if (!session) {
          // No local session — user is unauthenticated, skip the network call.
          setUser(null)
          setIsLoading(false)
          return
        }

        // Session exists — validate it against the server.
        const { data: { user }, error } = await supabase!.auth.getUser()
        if (error) {
          // Session is invalid or from wrong project — clear it so the UI resets.
          await supabase!.auth.signOut()
          setUser(null)
        } else {
          setUser(user ?? null)
        }
      } catch (error) {
        console.error("Error getting user:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const supabase = createClient()
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
