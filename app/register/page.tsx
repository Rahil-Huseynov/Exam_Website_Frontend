"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { PublicNavbar } from "@/components/public-navbar"

import { api } from "@/lib/api"
import { toastError } from "@/lib/toast"

interface RegisterResponse {
  success: boolean
  email?: string
  error?: string
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const lastErrorRef = useRef<string>("")

  function showError(msg: string) {
    if (!msg) return
    if (lastErrorRef.current === msg) return
    lastErrorRef.current = msg
    toastError(msg)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!firstName.trim()) {
      showError(t("errFirstNameRequired"))
      return
    }

    if (!email.trim()) {
      showError(t("errEmailRequired"))
      return
    }

    if (password !== confirmPassword) {
      showError(t("errPasswordsMismatch"))
      return
    }

    if (password.length < 6) {
      showError(t("errPasswordTooShort"))
      return
    }

    setLoading(true)
    try {
      const result = (await api.register(
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
      )) as RegisterResponse

      lastErrorRef.current = ""

      if (result.success && result.email) {
        router.push(`/verify?email=${encodeURIComponent(result.email)}`)
      } else {
        showError(result.error || t("errRegisterFailed"))
      }
    } catch (err: any) {
      showError(err instanceof Error ? err.message : t("errRegisterFailed"))
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
      <div className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-700/25" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">{t("register")}</CardTitle>
              <CardDescription>{t("registerSubtitle")}</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("firstName")}</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("lastName")}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-11 mt-2 bg-gradient-to-r from-violet-600 to-blue-600"
                  disabled={loading}
                >
                  {loading ? t("loading") : t("register")}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  {t("alreadyHaveAccount")}{" "}
                  <Link href="/login" className="text-violet-600 hover:underline font-medium">
                    {t("login")}
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
