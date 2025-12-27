"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
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
import { Globe, Sparkles } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const token = useMemo(() => (sp.get("token") || "").trim(), [sp])

  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)

  const [tokenChecking, setTokenChecking] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setError("")
      setSuccess(false)

      if (!token) {
        setTokenValid(false)
        setTokenChecking(false)
        return
      }

      setTokenChecking(true)
      try {
        const r = await api.checkResetToken(token)
        if (cancelled) return
        setTokenValid(!!r.valid)
      } catch {
        if (cancelled) return
        setTokenValid(false)
      } finally {
        if (!cancelled) setTokenChecking(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    const p = password
    const c = confirm

    // validations -> i18n
    if (!token) return setError(t("resetPasswordErrMissingToken") || "Token tapılmadı")
    if (!tokenValid) return setError(t("resetPasswordErrInvalidToken") || "Token etibarsızdır")
    if (!p || p.length < 6) return setError(t("resetPasswordErrTooShort") || "Şifrə ən az 6 simvol olmalıdır")
    if (p !== c) return setError(t("resetPasswordErrMismatch") || "Şifrələr uyğun gəlmir")

    setLoading(true)
    try {
      const res = await api.resetPassword(token, p)
      setSuccess(true)

      // Uğurlu toast -> bitəndə login
      toast.success(res?.message || t("resetPasswordToastSuccess") || "Şifrə uğurla dəyişdirildi", {
        autoClose: 2500,
        onClose: () => router.replace("/login"),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : (t("resetPasswordToastFail") || "Request failed")
      setError(msg)
      toast.error(msg)
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
                <DropdownMenuItem onClick={() => setLocale("az")}>{t("navbar.lang.az") || "Azərbaycan"}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>{t("navbar.lang.en") || "English"}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ru")}>{t("navbar.lang.ru") || "Русский"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">{t("resetPasswordTitle") || "Yeni şifrə təyin et"}</CardTitle>
              <CardDescription>{t("resetPasswordDesc") || "Yeni şifrənizi daxil edin və təsdiqləyin"}</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {tokenChecking && (
                  <Alert>
                    <AlertDescription>{t("resetPasswordCheckingToken") || "Token yoxlanılır..."}</AlertDescription>
                  </Alert>
                )}

                {!tokenChecking && !tokenValid && (
                  <Alert variant="destructive">
                    <AlertDescription>{t("resetPasswordTokenInvalidInline") || "Token etibarsızdır və ya vaxtı bitib"}</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* success inline saxlamaq istəyirsənsə (istəyə bağlı) */}
                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      {t("resetPasswordSuccessInline") || "Şifrə uğurla dəyişdirildi. Login səhifəsinə yönləndirilirsiniz..."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password") || "Yeni şifrə"}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || success || tokenChecking || !tokenValid}
                    required
                    className="h-11"
                    placeholder={t("resetPasswordPlaceholder") || "Minimum 6 simvol"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">{t("resetPasswordConfirmLabel") || "Şifrəni təsdiqlə"}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading || success || tokenChecking || !tokenValid}
                    required
                    className="h-11"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                  disabled={loading || success || tokenChecking || !tokenValid}
                >
                  {loading ? (t("saving") || "Yadda saxlanır...") : (t("resetPasswordSubmit") || "Şifrəni yenilə")}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  <Link href="/login" className="text-violet-600 hover:underline font-medium">
                    {t("backToLogin") || "Girişə qayıt"}
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
