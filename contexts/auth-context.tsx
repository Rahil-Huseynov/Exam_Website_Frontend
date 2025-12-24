"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { api, type User } from "@/lib/api"

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const didLogoutRef = useRef(false)

  const checkAuth = useCallback(async () => {
    if (didLogoutRef.current) {
      setLoading(false)
      return
    }

    try {
      const profile = await api.getProfile()
      setUser(profile)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const refreshUser = useCallback(async () => {
    if (didLogoutRef.current) return null

    try {
      const profile = await api.getProfile()
      setUser(profile)
      return profile
    } catch {
      setUser(null)
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    didLogoutRef.current = true
    setUser(null)
    api.clearToken()

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
    }
  }, [])

  const value = useMemo(() => ({ user, loading, refreshUser, logout }), [user, loading, refreshUser, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
