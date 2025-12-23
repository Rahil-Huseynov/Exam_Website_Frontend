"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Sparkles, CheckCircle2 } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }))
        setError(error.message || "Request failed")
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2"
            >
              <Sparkles className="h-6 w-6 text-violet-600" />
              ExamPlatform
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full border-2 bg-transparent">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("az")}>Azərbaycan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ru")}>Русский</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                {locale === "az" && "Şifrəni unutmusunuz?"}
                {locale === "en" && "Forgot Password?"}
                {locale === "ru" && "Забыли пароль?"}
              </CardTitle>
              <CardDescription>
                {locale === "az" && "Şifrənizi sıfırlamaq üçün e-poçt ünvanınızı daxil edin"}
                {locale === "en" && "Enter your email to reset your password"}
                {locale === "ru" && "Введите свой email для сброса пароля"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      {locale === "az" && "Şifrə sıfırlama linki e-poçtunuza göndərildi"}
                      {locale === "en" && "Password reset link sent to your email"}
                      {locale === "ru" && "Ссылка для сброса пароля отправлена на ваш email"}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || success}
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                  disabled={loading || success}
                >
                  {loading
                    ? locale === "az"
                      ? "Göndərilir..."
                      : locale === "ru"
                        ? "Отправка..."
                        : "Sending..."
                    : locale === "az"
                      ? "Şifrəni sıfırla"
                      : locale === "ru"
                        ? "Сбросить пароль"
                        : "Reset Password"}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  <Link href="/login" className="text-violet-600 hover:underline font-medium">
                    {locale === "az" && "Girişə qayıt"}
                    {locale === "en" && "Back to Login"}
                    {locale === "ru" && "Назад к входу"}
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
