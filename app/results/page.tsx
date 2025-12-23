"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type ExamAttempt } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Clock, TrendingUp } from "lucide-react"

export default function ResultsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadAttempts()
  }, [])

  async function loadAttempts() {
    try {
      setLoading(true)
      const data = await api.getAttempts()
      setAttempts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results")
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
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t("examResults")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {locale === "az" && "İmtahan nəticələrinizə və keçmişinizə baxın"}
              {locale === "en" && "View your exam results and history"}
              {locale === "ru" && "Просмотрите результаты экзаменов и историю"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-900"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-600 absolute top-0"></div>
              </div>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950/20 dark:to-blue-950/20 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-violet-600" />
              </div>
              <p className="text-muted-foreground text-lg mb-6">{t("noExams")}</p>
              <Button
                asChild
                className="h-12 px-8 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
              >
                <Link href="/exams">{t("takeExam")}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => {
                const percentage = (attempt.score / attempt.totalQuestions) * 100
                const isCompleted = !!attempt.completedAt
                const isPassed = percentage >= 70

                return (
                  <Card
                    key={attempt.id}
                    className="backdrop-blur-sm bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-balance flex items-center gap-3">
                            {attempt.exam.subject.name} - {attempt.exam.university.name}
                            {isCompleted && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${isPassed ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" : "bg-gradient-to-r from-red-500 to-orange-500 text-white"}`}
                              >
                                {isPassed
                                  ? locale === "az"
                                    ? "Uğurlu"
                                    : locale === "ru"
                                      ? "Успешно"
                                      : "Passed"
                                  : locale === "az"
                                    ? "Uğursuz"
                                    : locale === "ru"
                                      ? "Не сдан"
                                      : "Failed"}
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {t("year")}: {attempt.exam.year}
                          </CardDescription>
                        </div>
                        {isCompleted && (
                          <div className="text-right">
                            <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                              {percentage.toFixed(0)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {attempt.score}/{attempt.totalQuestions}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          {isCompleted ? (
                            <>
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20">
                                <TrendingUp className="h-4 w-4 text-violet-600" />
                                <span className="font-medium">{percentage.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                              </div>
                            </>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 font-medium">
                              {t("notCompleted")}
                            </span>
                          )}
                        </div>

                        {!isCompleted && (
                          <Button
                            asChild
                            size="sm"
                            className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                          >
                            <Link href={`/exam/${attempt.exam.id}`}>{t("continue")}</Link>
                          </Button>
                        )}
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
