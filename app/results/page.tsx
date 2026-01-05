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
import { BookOpen, Clock, TrendingUp } from "lucide-react"
import { api, ExamAttempt } from "@/lib/api"

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
      const res = await api.getUserExamAttempts(userId, "FINISHED")
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
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
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950/20 dark:to-blue-950/20 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-violet-600" />
              </div>
              <p className="text-muted-foreground text-lg mb-6">
                {t("noExams")}
              </p>
              <Button asChild className="h-12 px-8 bg-gradient-to-r from-violet-600 to-blue-600">
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

                return (
                  <Card
                    key={attempt.id}
                    className="bg-white/80 dark:bg-gray-950/80 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle>
                            {attempt.bank.university?.name} — {attempt.bank.title}
                          </CardTitle>
                          <CardDescription>
                            {t("year")}: {attempt.bank.year}
                          </CardDescription>
                        </div>

                        {isCompleted && (
                          <div className="text-right">
                            <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                              {percentage.toFixed(0)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {score}/{total}
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
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/20">
                                <TrendingUp className="h-4 w-4 text-violet-600" />
                                <span className="font-medium">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {attempt.finishedAt
                                    ? new Date(attempt.finishedAt).toLocaleDateString()
                                    : ""}
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 font-medium">
                              {t("notCompleted")}
                            </span>
                          )}
                        </div>

                        {isCompleted ? (
                          <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-blue-600">
                            <Link href={`/results/${attempt.id}`}>
                              {t("results.details")}
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-blue-600">
                            <Link href={`/exam/${attempt.bank.id}`}>
                              {t("continue")}
                            </Link>
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
