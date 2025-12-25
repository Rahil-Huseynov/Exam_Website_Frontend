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

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
}

const RELOAD_GUARD_KEY = "auth_401_reload_done"

function hasReloadedOnce(): boolean {
  if (typeof window === "undefined") return false
  return window.sessionStorage.getItem(RELOAD_GUARD_KEY) === "1"
}

function markReloadedOnce() {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(RELOAD_GUARD_KEY, "1")
}

function clearReloadGuard() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(RELOAD_GUARD_KEY)
}

/** ==========================
 * ✅ EXAM TOKEN HELPERS (sessionStorage)
 * ========================== */
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

const PROFILE_POLL_MS = 10_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const didLogoutRef = useRef(false)
  const isReloadingRef = useRef(false)

  // ✅ poll zamanı paralel request olmasın
  const pollingRef = useRef(false)

  const hardLogoutAndReload = useCallback(async () => {
    if (isReloadingRef.current) return
    if (hasReloadedOnce()) return

    isReloadingRef.current = true
    markReloadedOnce()

    try {
      if (user?.id) {
        await revokeAllExamTokens(user.id)
      } else {
        const pairs = listAllExamTokenPairs()
        for (const p of pairs) clearExamToken(p.bankId)
      }
    } catch {
    }

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

    deleteCookie("accessToken")

    if (typeof window !== "undefined") window.location.reload()
  }, [user?.id])

  /**
   * ✅ checkAuth iki rejimdə işləyir:
   * - Normal (silent=false): loading idarə edir, 401 olsa 1 dəfə hard logout+reload edə bilər
   * - Background (silent=true): loading dəyişmir, UI-ya toxunmur, 401 olsa sadəcə user=null edir (reload YOX)
   */
  const checkAuth = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent)

      if (didLogoutRef.current) return

      // silent poll üst-üstə minməsin
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
      } catch (e: any) {
        const msg = String(e?.message || "")
        const is401 = msg.includes("Status: 401") || msg.includes("(Status: 401)") || msg.includes("401")

        if (is401) {
          // ✅ Background poll zamanı: reload YOX, sadəcə sessiya bitibsə user=null
          if (silent) {
            setUser(null)
            return
          }

          // ✅ Normal check zamanı: 1 dəfə hard logout + reload (səndəki qoruma)
          if (!hasReloadedOnce()) {
            await hardLogoutAndReload()
            return
          }

          setUser(null)
          return
        }

        setUser(null)
      } finally {
        if (!silent) setLoading(false)
        if (silent) pollingRef.current = false
      }
    },
    [hardLogoutAndReload],
  )

  // ✅ ilk dəfə mount olanda normal check
  useEffect(() => {
    checkAuth({ silent: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuth])

  // ✅ hər 10 saniyədən bir background poll (tam arxa planda)
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
    if (didLogoutRef.current) return null

    try {
      const profile = await api.getProfile()
      setUser(profile)
      clearReloadGuard()
      return profile
    } catch (e: any) {
      const msg = String(e?.message || "")
      const is401 = msg.includes("Status: 401") || msg.includes("(Status: 401)") || msg.includes("401")

      if (is401) {
        // refreshUser user action kimidir -> burada da reload istəmirsənsə, sadəcə user=null
        setUser(null)
        return null
      }

      setUser(null)
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    if (isReloadingRef.current) return
    isReloadingRef.current = true

    try {
      if (user?.id) {
        await revokeAllExamTokens(user.id)
      } else {
        const pairs = listAllExamTokenPairs()
        for (const p of pairs) clearExamToken(p.bankId)
      }
    } catch {
    }

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

    deleteCookie("accessToken")

    if (typeof window !== "undefined") window.location.reload()
  }, [user?.id])

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
