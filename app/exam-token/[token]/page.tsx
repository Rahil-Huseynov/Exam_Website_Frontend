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

type AnyParams = Promise<Record<string, string | undefined>>

export default function ExamTokenPage({ params }: { params: AnyParams }) {
  const p = use(params)
  const token = useMemo(() => String(p.token || ""), [p])

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [attemptId, setAttemptId] = useState("")
  const [bankId, setBankId] = useState("")
  const [loading, setLoading] = useState(true)

  const deletedRef = useRef(false)

  useEffect(() => {
    if (authLoading) return

    if (!user?.id) {
      toast.error("Login olunmayıb.")
      router.replace("/login")
      return
    }

    if (!token) {
      toast.error("Token tapılmadı.")
      router.replace("/dashboard")
      return
    }

    ;(async () => {
      try {
        setLoading(true)

        const storedBankId =
          typeof window !== "undefined" ? window.sessionStorage.getItem(`exam_token_bank_${token}`) : null

        if (!storedBankId) {
          toast.error("bankId tapılmadı (session). Yenidən Dashboard-dan start et.")
          router.replace("/dashboard")
          return
        }

        const bank = String(storedBankId)
        setBankId(bank)
        const created = await api.createAttemptWithToken(bank, user.id, token)
        setAttemptId(created.attemptId)
      } catch (e: any) {
        toast.error(e?.message || "Bu linklə imtahana başlamaq mümkün olmadı.")
        router.replace("/dashboard")
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading, user?.id, token, router])

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) return
    if (!token) return
    if (!bankId) return

    const deleteNow = () => {
      if (deletedRef.current) return
      deletedRef.current = true

      try {
        const payload = JSON.stringify({ userId: user.id, token })
        const url = `${process.env.NEXT_PUBLIC_API_URL}/banks/${encodeURIComponent(bankId)}/exam-token/delete`

        if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
          const blob = new Blob([payload], { type: "application/json" })
          navigator.sendBeacon(url, blob)
          return
        }
      } catch {}

      api.deleteExamToken(bankId, user.id, token, true).catch(() => null)
    }

    const onBeforeUnload = () => deleteNow()
    const onVisibility = () => {
      if (document.visibilityState === "hidden") deleteNow()
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("visibilitychange", onVisibility)
      deleteNow()
    }
  }, [authLoading, user?.id, token, bankId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <ToastContainer position="top-right" autoClose={2200} newestOnTop closeOnClick pauseOnHover theme="colored" />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">Yüklənir...</CardContent>
          </Card>
        ) : !attemptId ? (
          <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Attempt yaradılmadı.
            </CardContent>
          </Card>
        ) : (
          <ExamTokenRunner attemptId={attemptId} userId={user!.id} />
        )}
      </main>
    </div>
  )
}
