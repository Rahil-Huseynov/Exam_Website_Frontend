"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, TrendingUp, Wallet, FileText, ArrowRight } from "lucide-react"

type Attempt = any 

function getDisplayName(user: any) {
  if (!user) return "User"
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return full || user.name || user.email || "User"
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = useCallback(async () => {
    try {
      setError("")
      setLoading(true)

      const profile = user ?? (await refreshUser())
      if (!profile) {
        router.replace("/login")
        return
      }

      const data = await api.getUserAttempts(profile.id) 
      setAttempts(Array.isArray(data.attempts) ? data.attempts : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [user, refreshUser, router])

  useEffect(() => {
    if (!authLoading) loadData()
  }, [authLoading, loadData])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Login olunur...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const displayName = getDisplayName(user)
  const balance = typeof (user as any).balance === "number" ? (user as any).balance : 0

  const completedAttempts = attempts.filter((a) => a?.completedAt)
  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + ((a.score || 0) / (a.totalQuestions || 1)) * 100, 0) / completedAttempts.length
      : 0

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("welcome")}
              </span>
              , {displayName}!
            </h1>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">{t("yourBalance")}</CardTitle>
                <Wallet className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{balance.toFixed(2)} AZN</div>
                <Button asChild variant="link" className="px-0 h-auto mt-3">
                  <Link href="/balance" className="flex items-center gap-1">
                    {t("addBalance")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">{t("examsTaken")}</CardTitle>
                <BookOpen className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedAttempts.length}</div>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">{t("averageScore")}</CardTitle>
                <TrendingUp className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{averageScore.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">{t("totalSpent")}</CardTitle>
                <FileText className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {attempts.reduce((sum, a) => sum + (a?.exam?.price || 0), 0).toFixed(2)} AZN
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
