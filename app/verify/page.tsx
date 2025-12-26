"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"

import { api } from "@/lib/api"
import { toast } from "react-toastify"
import { PublicNavbar } from "@/components/public-navbar"

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [resending, setResending] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const email = searchParams.get("email")

  const lastToastRef = useRef<string>("")

  const emailText = useMemo(() => email || "", [email])

  function toastOnce(type: "success" | "error" | "info", msg: string) {
    if (!msg) return
    if (lastToastRef.current === msg) return
    lastToastRef.current = msg

    const opts = { toastId: msg }

    if (type === "success") toast.success(msg, opts)
    else if (type === "info") toast.info(msg, opts)
    else toast.error(msg, opts)
  }

  useEffect(() => {
    if (!email) router.push("/register")
  }, [email, router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    if (code.trim().length !== 6) {
      toastOnce("error", t("errVerifyCode6Digits"))
      return
    }

    setStatus("loading")

    try {
      const result = await api.verifyEmail(email, code.trim())

      if (result?.success) {
        setStatus("success")
        toastOnce("success", t("verifySuccess"))

        setTimeout(() => router.push("/dashboard"), 1200)
      } else {
        setStatus("error")
        const msg = result?.error || t("verifyFailed")
        toastOnce("error", msg)
      }
    } catch {
      setStatus("error")
      toastOnce("error", t("verifyFailed"))
    }
  }

  async function handleResend() {
    if (!email) return
    setResending(true)

    try {
      const result = await api.resendVerificationCode(email)

      if (result?.success) {
        toastOnce("success", t("verifyResentSuccess"))
      } else {
        const msg = result?.error || t("verifyResentFailed")
        toastOnce("error", msg)
      }
    } finally {
      setResending(false)
    }
  }

  if (!email) return null

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-50">
        <PublicNavbar />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-violet-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              ExamPlatform
            </span>
          </Link>

          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("verifyTitle")}</CardTitle>
              <CardDescription>{t("verifySubtitleWithEmail", { email: emailText })}</CardDescription>
            </CardHeader>

            <form onSubmit={handleVerify}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t("verifyCodeLabel")}</Label>
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={status === "loading" || status === "success"}
                    className="h-11 text-center text-2xl tracking-widest"
                    maxLength={6}
                    placeholder="000000"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full mt-2 h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading" ? t("verifying") : t("verifyBtn")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleResend}
                  disabled={resending || status === "success"}
                >
                  {resending ? t("sending") : t("resendCode")}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
