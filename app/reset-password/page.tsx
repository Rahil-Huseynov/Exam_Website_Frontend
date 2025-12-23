"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Sparkles, XCircle } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }

    async function checkToken() {
      try {
        const response = await fetch(`${API_URL}/auth/check-token?token=${token}`)
        const data = await response.json()
        setTokenValid(data.valid)
      } catch (err) {
        setTokenValid(false)
      }
    }

    checkToken()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError(
        locale === "az" ? "Şifrələr uyğun gəlmir" : locale === "ru" ? "Пароли не совпадают" : "Passwords do not match",
      )
      return
    }

    if (password.length < 6) {
      setError(
        locale === "az"
          ? "Şifrə ən azı 6 simvol olmalıdır"
          : locale === "ru"
            ? "Пароль должен содержать не менее 6 символов"
            : "Password must be at least 6 characters",
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Reset failed" }))
        setError(error.message || "Reset failed")
      } else {
        router.push("/login")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-600 absolute top-0"></div>
          </div>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl" />

        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            <Link href="/" className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-violet-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                ExamPlatform
              </span>
            </Link>

            <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-destructive">
                  {locale === "az" && "Etibarsız Token"}
                  {locale === "en" && "Invalid Token"}
                  {locale === "ru" && "Недействительный токен"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {locale === "az" &&
                      "Bu şifrə sıfırlama linki etibarsız və ya vaxtı keçibdir. Zəhmət olmasa yenidən cəhd edin."}
                    {locale === "en" && "This password reset link is invalid or has expired. Please try again."}
                    {locale === "ru" &&
                      "Эта ссылка для сброса пароля недействительна или истекла. Пожалуйста, попробуйте снова."}
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                >
                  <Link href="/forgot-password">
                    {locale === "az" && "Yeni link istə"}
                    {locale === "en" && "Request New Link"}
                    {locale === "ru" && "Запросить новую ссылку"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    )
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
                {locale === "az" && "Yeni Şifrə"}
                {locale === "en" && "New Password"}
                {locale === "ru" && "Новый пароль"}
              </CardTitle>
              <CardDescription>
                {locale === "az" && "Yeni şifrənizi daxil edin"}
                {locale === "en" && "Enter your new password"}
                {locale === "ru" && "Введите новый пароль"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {locale === "az" && "Şifrəni təsdiqlə"}
                    {locale === "en" && "Confirm Password"}
                    {locale === "ru" && "Подтвердите пароль"}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                  disabled={loading}
                >
                  {loading
                    ? locale === "az"
                      ? "Yenilənir..."
                      : locale === "ru"
                        ? "Обновление..."
                        : "Updating..."
                    : locale === "az"
                      ? "Şifrəni yenilə"
                      : locale === "ru"
                        ? "Обновить пароль"
                        : "Update Password"}
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
