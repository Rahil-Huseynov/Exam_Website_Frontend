"use client"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { api, type User } from "@/lib/api"
import {
  clearAllData,
  mark401Once,
  has401Occurred,
  clear401Flag,
} from "@/helper/clearalldata"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function listAllExamTokenPairs(): Array<{ bankId: string; token: string }> {
  if (typeof window === "undefined") return []
  const out: Array<{ bankId: string; token: string }> = []
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i)
    if (!k) continue
    if (!k.startsWith("exam_token_")) continue
    const token = window.sessionStorage.getItem(k) || ""
    const bankId = k.replace("exam_token_", "")
    if (token && bankId) out.push({ bankId, token })
  }
  return out
}

function clearExamToken(bankId: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(`exam_token_${bankId}`)
}

async function revokeAllExamTokens(userId: number) {
  const pairs = listAllExamTokenPairs()
  for (const p of pairs) {
    try {
      await api.revokeExamToken(p.bankId, userId, p.token)
    } catch {
    } finally {
      clearExamToken(p.bankId)
    }
  }
}

const RELOAD_GUARD_KEY = "auth_401_reload_done"
function clearReloadGuard() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(RELOAD_GUARD_KEY)
}

const PROFILE_POLL_MS = 10_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const didLogoutRef = useRef(false)
  const isReloadingRef = useRef(false)
  const pollingRef = useRef(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken")
      if (token) api.setToken(token)
    }
  }, [])

  const handleFirst401 = useCallback(() => {
    if (has401Occurred()) return
    mark401Once()
  }, [])

  const checkAuth = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent)
      if (didLogoutRef.current) return

      if (silent) {
        if (pollingRef.current) return
        pollingRef.current = true
      } else {
        setLoading(true)
      }

      try {
        const profile = await api.getProfile()
        setUser(profile)
        clearReloadGuard()
        clear401Flag()
      } catch (e: any) {
        const msg = String(e?.message || "")
        const is401 =
          msg.includes("Status: 401") ||
          msg.includes("(Status: 401)") ||
          msg.includes("401")

        if (is401) {
          handleFirst401()
          setUser(null)
          return
        }

        setUser(null)
      } finally {
        if (!silent) setLoading(false)
        if (silent) pollingRef.current = false
      }
    },
    [handleFirst401],
  )

  useEffect(() => {
    checkAuth({ silent: false })
  }, [checkAuth])

  useEffect(() => {
    if (typeof window === "undefined") return
    const id = window.setInterval(() => {
      if (didLogoutRef.current) return
      if (isReloadingRef.current) return
      void checkAuth({ silent: true })
    }, PROFILE_POLL_MS)

    return () => window.clearInterval(id)
  }, [checkAuth])

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.getProfile()
      setUser(profile)
      clearReloadGuard()
      clear401Flag()
      return profile
    } catch {
      setUser(null)
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    if (isReloadingRef.current) return
    isReloadingRef.current = true

    try {
      if (user?.id) await revokeAllExamTokens(user.id)
      else {
        const pairs = listAllExamTokenPairs()
        for (const p of pairs) clearExamToken(p.bankId)
      }
    } catch {}

    didLogoutRef.current = true
    setUser(null)
    api.clearToken()

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
      })
    } catch {}

    if (typeof window !== "undefined") clearAllData()

    router.replace("/login") 
  }, [user?.id, router])

  const value = useMemo(
    () => ({ user, loading, refreshUser, logout }),
    [user, loading, refreshUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
