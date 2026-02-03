"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api } from "@/lib/api"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Sparkles, CheckCircle2 } from "lucide-react"
import { PublicNavbar } from "@/components/public-navbar"

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(false)
    setLoading(true)

    try {
      const em = email.trim().toLowerCase()
      const res = await api.forgotPassword(em)

      setSuccess(true)

      toast.success(res?.message || t("forgotPasswordToastSuccess"), {
        autoClose: 2500,
        onClose: () => router.push("/login"),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("forgotPasswordToastNetwork")
      setError(msg)
      toast.error(msg)
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

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2"
            >
              <img className="w-40" src="/Logo.png" alt="İmtahanVer.net logosu" />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full border-2 bg-transparent">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("az")}>{t("navbar.lang.az") || "Azərbaycan"}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>{t("navbar.lang.en") || "English"}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ru")}>{t("navbar.lang.ru") || "Русский"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">{t("forgotPasswordTitle")}</CardTitle>
              <CardDescription>{t("forgotPasswordDesc")}</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      {t("forgotPasswordSuccessInline")}
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
                    placeholder={t("forgotPasswordEmailPlaceholder")}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-11 mt-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                  disabled={loading || success}
                >
                  {loading ? t("sending") : t("forgotPasswordSubmit")}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  <Link href="/login" className="text-violet-600 hover:underline font-medium">
                    {t("forgotPasswordBackToLogin")}
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
