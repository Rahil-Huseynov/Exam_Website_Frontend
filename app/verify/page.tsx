"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { verifyEmailAction, resendVerificationAction } from "@/app/actions/auth"
import { useLocale } from "@/contexts/locale-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Sparkles } from "lucide-react"
import { api } from "@/lib/api"

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [resending, setResending] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { locale } = useLocale()
  const email = searchParams.get("email")

  useEffect(() => {
    if (!email) {
      router.push("/register")
    }
  }, [email, router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    setMessage("")

    try {
      const result = await api.verifyEmail(email, code)
      if (result.success) {
        setStatus("success")
        setMessage(
          locale === "az"
            ? "E-poçtunuz uğurla doğrulandı!"
            : locale === "ru"
              ? "Ваша электронная почта успешно подтверждена!"
              : "Your email has been verified successfully!",
        )
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setStatus("error")
        setMessage(result.error || "Verification failed")
      }
    } catch (error) {
      setStatus("error")
      setMessage(
        error instanceof Error
          ? error.message
          : locale === "az"
            ? "Doğrulama uğursuz oldu"
            : locale === "ru"
              ? "Не удалось подтвердить"
              : "Verification failed",
      )
    }
  }

  async function handleResend() {
    if (!email) return

    setResending(true)
    setMessage("")

    try {
      const result = await api.resendVerificationCode(email)
      if (result.success) {
        setMessage(locale === "az" ? "Yeni kod göndərildi" : locale === "ru" ? "Новый код отправлен" : "New code sent")
      } else {
        setMessage(result.error || "Failed to resend")
      }
    } catch (error) {
      setMessage("Failed to resend verification code")
    } finally {
      setResending(false)
    }
  }

  if (!email) return null

  return (
    <div className="min-h-screen relative overflow-hidden">
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
              <CardTitle className="text-2xl">
                {locale === "az" && "E-poçt Doğrulama"}
                {locale === "en" && "Email Verification"}
                {locale === "ru" && "Подтверждение электронной почты"}
              </CardTitle>
              <CardDescription>
                {locale === "az" && `${email} ünvanına göndərilən 6 rəqəmli kodu daxil edin`}
                {locale === "en" && `Enter the 6-digit code sent to ${email}`}
                {locale === "ru" && `Введите 6-значный код, отправленный на ${email}`}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleVerify}>
              <CardContent className="space-y-4">
                {status === "success" && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-400">{message}</AlertDescription>
                  </Alert>
                )}
                {status === "error" && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
                {message && status === "idle" && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <AlertDescription className="text-blue-700 dark:text-blue-400">{message}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="code">
                    {locale === "az" && "Doğrulama Kodu"}
                    {locale === "en" && "Verification Code"}
                    {locale === "ru" && "Код подтверждения"}
                  </Label>
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
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading"
                    ? locale === "az"
                      ? "Doğrulanır..."
                      : locale === "ru"
                        ? "Проверка..."
                        : "Verifying..."
                    : locale === "az"
                      ? "Doğrula"
                      : locale === "ru"
                        ? "Подтвердить"
                        : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleResend}
                  disabled={resending || status === "success"}
                >
                  {resending
                    ? locale === "az"
                      ? "Göndərilir..."
                      : locale === "ru"
                        ? "Отправка..."
                        : "Sending..."
                    : locale === "az"
                      ? "Yenidən göndər"
                      : locale === "ru"
                        ? "Отправить снова"
                        : "Resend Code"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
