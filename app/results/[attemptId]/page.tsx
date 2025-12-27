"use client"

import { useEffect, useMemo, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type AttemptReviewResponse } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react"

type AnyParams = Promise<Record<string, string | undefined>>

export default function AttemptDetailsPage({ params }: { params: AnyParams }) {
  const p = use(params)
  const attemptId = useMemo(() => String(p.attemptId || p.id || ""), [p])

  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [data, setData] = useState<AttemptReviewResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!attemptId) return
    if (!user?.id) return
    load(attemptId, user.id)
  }, [attemptId, user?.id])

  async function load(aid: string, userId: number) {
    try {
      setLoading(true)
      const res = await api.getAttemptReview(aid, userId)
      setData(res)
    } catch {
      toast.error(t("errGeneric"))
    } finally {
      setLoading(false)
    }
  }

  const stats = data?.stats
  const attempt = data?.attempt
  const exam = data?.exam

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">{t("examResults")}</h1>
              {exam && (
                <p className="text-muted-foreground mt-1">
                  {exam.subject?.name} — {exam.university?.name} • {t("year")}: {exam.year}
                </p>
              )}
            </div>

            <Button asChild variant="outline" className="gap-2">
              <Link href="/results">
                <ArrowLeft className="h-4 w-4" />
                {t("goBack")}
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading")}</div>
          ) : !data ? (
            <div className="py-12 text-center text-muted-foreground">{t("noData")}</div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t("examRunner.result.title")}</span>
                    <span className="text-sm text-muted-foreground">
                      {attempt?.finishedAt ? new Date(attempt.finishedAt).toLocaleString() : ""}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Stat label={t("examRunner.result.correct")} value={stats?.correct} green />
                    <Stat label={t("examRunner.result.wrong")} value={stats?.wrong} red />
                    <Stat label={t("examRunner.result.total")} value={stats?.answered} />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {data.items.map((it, idx) => {
                  const correctId = it.question.correctOptionId

                  return (
                    <Card key={it.answerId}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>
                            {t("questionsLabel")} #{idx + 1}
                          </span>

                          {it.isCorrect ? (
                            <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold">
                              <CheckCircle2 className="h-5 w-5" />
                              {t("examRunner.result.correct")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-rose-600 font-semibold">
                              <XCircle className="h-5 w-5" />
                              {t("examRunner.result.wrong")}
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="font-medium whitespace-pre-wrap">{it.question.text}</div>

                        <div className="space-y-2">
                          {it.question.options.map((op) => {
                            const isCorrect = op.id === correctId
                            const isSelected = op.id === it.selected.id

                            return (
                              <div
                                key={op.id}
                                className={`px-4 py-3 rounded-xl border flex gap-3 ${
                                  isCorrect
                                    ? "border-emerald-400 bg-emerald-50"
                                    : isSelected
                                    ? "border-rose-400 bg-rose-50"
                                    : "border-gray-200"
                                }`}
                              >
                                <span>{isCorrect ? "✅" : isSelected ? "👉" : "•"}</span>
                                <span>{op.text}</span>
                              </div>
                            )
                          })}
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            <b>{t("examRunner.badge.your_choice")}:</b> {it.selected.text}
                          </div>
                          <div>
                            <b>{t("examRunner.ui.correct_answer")}:</b>{" "}
                            {it.question.correctOptionText ?? "-"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function Stat({
  label,
  value,
  green,
  red,
}: {
  label: string
  value?: number
  green?: boolean
  red?: boolean
}) {
  return (
    <div
      className={`px-4 py-2 rounded-xl ${
        green ? "bg-emerald-50" : red ? "bg-rose-50" : "bg-violet-50"
      }`}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value ?? 0}</div>
    </div>
  )
}
