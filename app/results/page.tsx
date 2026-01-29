"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Bot, Clock, TrendingUp } from "lucide-react"
import { api, ExamAttempt } from "@/lib/api"
import Image from "next/image"

export default function ResultsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    loadAttempts(user.id)
  }, [user?.id])

  async function loadAttempts(userId: number) {
    try {
      setLoading(true)
      const res = await api.getUserExamAttempts(userId, ["FINISHED", "WAITING_AI"])
      setAttempts(res.attempts || [])
    } catch {
      toast.error(t("errGeneric"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t("examResults")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {t("results.subtitle")}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-900" />
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-600 absolute top-0" />
              </div>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950/20 dark:to-blue-950/20 flex items-center justify-center shadow-lg">
                <BookOpen className="h-12 w-12 text-violet-600" />
              </div>
              <p className="text-muted-foreground text-lg mb-6">
                {t("noExams")}
              </p>
              <Button asChild className="h-12 px-8 bg-gradient-to-r from-violet-600 to-blue-600 shadow-md">
                <Link href="/exams">{t("takeExam")}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => {
                const total = attempt.total || 0
                const score = attempt.score || 0
                const percentage = total > 0 ? (score / total) * 100 : 0
                const isCompleted = attempt.status === "FINISHED" && !!attempt.finishedAt
                const isWaitingAI = attempt.status === "WAITING_AI"
                const bankType = (attempt.bank?.type || attempt.type || "").toString().toUpperCase()
                const showAIBadge = bankType === "WRITING"
                const isTest = bankType === "TEST"

                return (
                  <Card
                    key={attempt.id}
                    className="bg-white/80 dark:bg-gray-950/80 shadow-xl hover:shadow-2xl transition-all overflow-hidden"
                  >
                    <CardHeader className="relative">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {attempt.bank.university?.name} — {attempt.bank.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {t("year")}: {attempt.bank.year}
                          </CardDescription>
                        </div>

                        {showAIBadge ? (
                          <div className="absolute right-4 top-4 flex items-center gap-3">
                            <div className="hidden sm:flex items-center text-muted-foreground">
                              <Image src="/ai.png" alt="AI icon" width={44} height={44} />
                            </div>
                          </div>
                        ) : (
                          <div className="absolute right-4 top-4">
                            {isTest && (
                              <Image src="/test.png" alt="Test icon" width={44} height={44} />
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-50 to-blue-50 dark:bg-violet-950/10 shadow-inner">
                            <TrendingUp className="h-4 w-4 text-violet-600" />
                            <div className="flex flex-col leading-none">
                              <span className="font-medium text-sm">
                                {isCompleted ? `${percentage.toFixed(1)}%` : isWaitingAI ? t("checking") : t("notCompleted")}
                              </span>
                              {isCompleted && <span className="text-xs text-muted-foreground">{score}/{total}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {attempt.finishedAt
                                ? new Date(attempt.finishedAt).toLocaleString(locale, {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                : isWaitingAI ? t("checking") : t("notCompleted")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-blue-600 shadow-sm">
                              <Link href={`/results/${attempt.id}`}>
                                {t("results.details")}
                              </Link>
                            </Button>
                          ) : isWaitingAI ? (
                            <Button size="sm" disabled className="opacity-80 cursor-not-allowed bg-gradient-to-r from-yellow-400 to-yellow-300 text-black">
                              {t("checking")}
                            </Button>
                          ) : (
                            <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-blue-600 shadow-sm">
                              <Link href={`/exam/${attempt.bank.id}`}>
                                {t("continue")}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
