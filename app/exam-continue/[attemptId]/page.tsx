"use client"

import { use, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import ExamTokenRunner from "@/components/exam-token-runner"
import { Card, CardContent } from "@/components/ui/card"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

type AnyParams = Promise<Record<string, string | undefined>>

export default function ExamContinuePage({ params }: { params: AnyParams }) {
  const p = use(params)
  const attemptId = String(p.attemptId || "")

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(true)

  const ranRef = useRef(false)

  useEffect(() => {
    if (authLoading) return
    if (ranRef.current) return

    if (!attemptId) {
      router.replace("/results")
      return
    }

    if (!user?.id) {
      toast.error(t("examTokenNotLoggedIn") || "Daxil olmalısınız")
      router.replace("/login")
      return
    }

    ranRef.current = true

    ;(async () => {
      try {
        setLoading(true)

        const raw = await api.getAttemptSummary(attemptId)
        const s = (raw as any)?.data ?? raw
        const status = String(s?.status || "").toUpperCase()

        if (!s || !status) {
          toast.error(t("attemptNotCreated") || "İmtahan tapılmadı")
          router.replace("/results")
          return
        }

        if (status === "FINISHED" || status === "WAITING_AI") {
          toast.info(t("examAlreadyFinished") || "Bu imtahan artıq bitib")
          router.replace(`/results/${attemptId}`)
          return
        }

        if (status !== "IN_PROGRESS") {
          toast.error(t("errGeneric") || "İmtahan davam etdirilə bilməz")
          router.replace("/results")
          return
        }

        setOk(true)
      } catch (e: any) {
        console.error("exam-continue error:", e)
        toast.error(e?.message || t("errGeneric") || "Xəta baş verdi")
        router.replace("/results")
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading, user?.id, attemptId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <ToastContainer
        position="top-right"
        autoClose={2200}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("loadingText") || "Yüklənir..."}
            </CardContent>
          </Card>
        ) : ok && user?.id ? (
          <ExamTokenRunner
            attemptId={attemptId}
            userId={user.id}
            onFinished={() => {
              router.replace(`/results/${attemptId}`)
            }}
          />
        ) : (
          <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("attemptNotCreated") || "İmtahan açıla bilmədi"}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}