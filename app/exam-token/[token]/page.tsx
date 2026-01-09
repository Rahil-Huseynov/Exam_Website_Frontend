"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { Navbar } from "@/components/navbar"
import ExamTokenRunner from "@/components/exam-token-runner"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

type AnyParams = Promise<Record<string, string | undefined>>

export default function ExamTokenPage({ params }: { params: AnyParams }) {
  const p = use(params)
  const token = useMemo(() => String(p.token || ""), [p])

  const router = useRouter()
  const refreshedOnceRef = useRef(false)
  const { user, loading: authLoading, refreshUser } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [attemptId, setAttemptId] = useState("")
  const [bankId, setBankId] = useState("")
  const [loading, setLoading] = useState(true)
  const [guardEnabled, setGuardEnabled] = useState(false)

  const allowingRef = useRef(false)

  const confirmLeave = () => {
    if (allowingRef.current) return true
    return window.confirm(t("exam.leave_confirm"))
  }
  useEffect(() => {
    if (attemptId) setGuardEnabled(true)
  }, [attemptId])

  useEffect(() => {
    if (!guardEnabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
      return ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [guardEnabled])

  useEffect(() => {
    if (!guardEnabled) return

    history.pushState({ guard: true }, "", window.location.href)

    const handlePopState = () => {
      const ok = confirmLeave()
      if (ok) {
        allowingRef.current = true
        setGuardEnabled(false)
        history.back()
      } else {
        history.pushState({ guard: true }, "", window.location.href)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [guardEnabled, t])

  useEffect(() => {
    if (!guardEnabled) return

    const onClickCapture = (e: MouseEvent) => {
      if (allowingRef.current) return

      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (!target) return

      const a = target.closest("a") as HTMLAnchorElement | null
      if (!a) return

      const href = a.getAttribute("href") || ""

      if (!href || href.startsWith("#")) return
      if (a.target === "_blank") return
      if (href.startsWith("http")) return

      const ok = confirmLeave()
      if (!ok) {
        e.preventDefault()
        e.stopPropagation()
      } else {
        allowingRef.current = true
        setGuardEnabled(false)
      }
    }

    document.addEventListener("click", onClickCapture, true)
    return () => document.removeEventListener("click", onClickCapture, true)
  }, [guardEnabled, t])

  const guardedReplace = (url: string) => {
    if (!guardEnabled) return router.replace(url)
    const ok = confirmLeave()
    if (!ok) return
    allowingRef.current = true
    setGuardEnabled(false)
    router.replace(url)
  }
  useEffect(() => {
    if (authLoading) return

    if (!user?.id) {
      toast.error(t("examTokenNotLoggedIn"))
      guardedReplace("/login")
      return
    }

    if (!token) {
      toast.error(t("examTokenMissing"))
      guardedReplace("/dashboard")
      return
    }

    ; (async () => {
      try {
        setLoading(true)

        const storedBankId =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(`exam_token_bank_${token}`)
            : null

        if (!storedBankId) {
          toast.error(t("examTokenBankMissingSession"))
          guardedReplace("/dashboard")
          return
        }

        const bank = String(storedBankId)
        setBankId(bank)

        const attemptKey = `exam_attempt_${token}`
        const existingAttemptId =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(attemptKey)
            : null

        if (existingAttemptId) {
          setAttemptId(existingAttemptId)

          if (!refreshedOnceRef.current) {
            refreshedOnceRef.current = true
            void refreshUser()
          }

          return
        }

        const created = await api.createAttemptWithToken(bank, user.id, token)

        const newAttemptId = String((created as any).attemptId || "")
        if (!newAttemptId) {
          toast.error(t("examTokenAttemptIdMissing"))
          guardedReplace("/dashboard")
          return
        }

        setAttemptId(newAttemptId)

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(attemptKey, newAttemptId)
        }

        if (!refreshedOnceRef.current) {
          refreshedOnceRef.current = true
          void refreshUser()
        }
      } catch (e: any) {
        toast.error(e?.message || t("examTokenStartFail"))
        guardedReplace("/dashboard")
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading, user?.id, token, refreshUser, t])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <ToastContainer position="top-right" autoClose={2200} newestOnTop closeOnClick pauseOnHover theme="colored" />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">{t("loadingText")}</CardContent>
          </Card>
        ) : !attemptId ? (
          <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("attemptNotCreated")}
            </CardContent>
          </Card>
        ) : (
          <ExamTokenRunner
            attemptId={attemptId}
            userId={user!.id}
            onFinished={() => {
              allowingRef.current = true
              setGuardEnabled(false)
            }}
          />
        )}
      </main>
    </div>
  )
}
