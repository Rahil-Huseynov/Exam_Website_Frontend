"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { PublicNavbar } from "@/components/public-navbar"
import { toast } from "react-toastify"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const { refreshUser } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const router = useRouter()

  const pick = (az: string, en: string, ru: string) => (locale === "az" ? az : locale === "ru" ? ru : en)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const em = email.trim()
    const pw = password

    if (!em) {
      toast.error(pick("Email daxil edin", "Enter email", "Введите email"), { toastId: `login:email:${Date.now()}` })
      return
    }

    if (!pw) {
      toast.error(pick("Şifrə daxil edin", "Enter password", "Введите пароль"), {
        toastId: `login:pw:${Date.now()}`,
      })
      return
    }

    setLoading(true)

    try {
      const result = await api.login(em, pw)

      const token = (result as any).accessToken || (result as any).access_token
      if (token) api.setToken(token)

      const user = await refreshUser()

      toast.success(pick("Uğurla daxil oldunuz", "Logged in successfully", "Вы успешно вошли"), {
        toastId: `login:ok:${Date.now()}`,
      })

      if (user && (user.role === "admin" || user.role === "superadmin")) {
        router.replace("/admin")
      } else {
        router.replace("/dashboard")
      }
    } catch (err: any) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-50">
        <PublicNavbar />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">{t("login")}</CardTitle>
              <CardDescription>
                {locale === "az" && "Hesabınıza daxil olun"}
                {locale === "en" && "Sign in to your account"}
                {locale === "ru" && "Войдите в свой аккаунт"}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* ❌ Alert YOX — error yalnız toast ilə */}

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("password")}</Label>
                    <Link href="/forgot-password" className="text-sm text-violet-600 hover:underline">
                      {locale === "az" && "Unutmusunuz?"}
                      {locale === "en" && "Forgot?"}
                      {locale === "ru" && "Забыли?"}
                    </Link>
                  </div>

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
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r mt-2 from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                  disabled={loading}
                >
                  {loading ? pick("Gözləyin...", "Loading...", "Подождите...") : t("login")}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  {locale === "az" && "Hesabınız yoxdur? "}
                  {locale === "en" && "Don't have an account? "}
                  {locale === "ru" && "Нет аккаунта? "}
                  <Link href="/register" className="text-violet-600 hover:underline font-medium">
                    {t("register")}
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
