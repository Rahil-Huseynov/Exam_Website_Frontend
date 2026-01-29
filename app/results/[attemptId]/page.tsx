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
import { CheckCircle2, XCircle, ArrowLeft, Flag, FlagOff } from "lucide-react"

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
      toast.error(t("errGeneric") || "Xəta baş verdi")
    } finally {
      setLoading(false)
    }
  }

  async function toggleFlag(questionId: string, current: boolean) {
    if (!attemptId || !user?.id) return
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map((it) =>
          it.question.id === questionId ? { ...it, flag: !current } : it,
        ),
      }
    })
    try {
      await api.setAttemptFlag(attemptId, questionId, !current)
    } catch (e: any) {
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.question.id === questionId ? { ...it, flag: current } : it,
          ),
        }
      })
      toast.error(t("errGeneric") || "Xəta baş verdi")
    }
  }

  const stats = data?.stats
  const attempt = data?.attempt
  const exam = data?.exam
  const flagCount = data?.items.filter((it) => it.flag).length ?? 0

  const isWritingAttempt = data?.items?.length
    ? data.items.every((it) => !it.question.options || it.question.options.length === 0)
    : false

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
                    {isWritingAttempt ? (
                      <>
                        <Stat
                          label={t("score") ?? "Bal"}
                          value={attempt?.score}
                          green
                        />
                        <Stat
                          label={t("examRunner.result.total")}
                          value={attempt?.total}
                        />
                        <Stat
                          label={t("examRunner.result.total.flag")}
                          value={flagCount}
                          yellow
                        />
                      </>
                    ) : (
                      <>
                        <Stat label={t("examRunner.result.correct")} value={stats?.correct} green />
                        <Stat label={t("examRunner.result.wrong")} value={stats?.wrong} red />
                        <Stat label={t("examRunner.result.total")} value={stats?.total} />
                        <Stat
                          label={t("examRunner.result.total.flag")}
                          value={flagCount}
                          yellow
                        />
                      </>
                    )}
                  </div>
                </CardContent>

              </Card>

              <CardContent className="space-y-4">
                {data.items.map((it, idx) => {
                  const q = it.question
                  const opts = q.options ?? []
                  const hasOptions = Array.isArray(opts) && opts.length > 0
                  const correctId = q.correctOptionId ?? null

                  const headerStatus = (() => {
                    if (isWritingAttempt) {
                      if (it.isCorrect === true) {
                        return (
                          <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold">
                            <CheckCircle2 className="h-5 w-5" />
                            {t("examRunner.result.correct")}
                          </span>
                        )
                      } else if (it.isCorrect === false) {
                        return (
                          <span className="inline-flex items-center gap-2 text-rose-600 font-semibold">
                            <XCircle className="h-5 w-5" />
                            {t("examRunner.result.wrong")}
                          </span>
                        )
                      } else {
                        return (
                          <div className="text-sm text-muted-foreground">
                            {it.score != null ? `${t("score") ?? "Qiymət"}: ${it.score}` : (it.feedback ? (t("feedback") ?? "Feedback") : (t("pending") ?? "Gözləmədə"))}
                          </div>
                        )
                      }
                    } else {
                      return it.isCorrect ? (
                        <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-5 w-5" />
                          {t("examRunner.result.correct")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-rose-600 font-semibold">
                          <XCircle className="h-5 w-5" />
                          {t("examRunner.result.wrong")}
                        </span>
                      )
                    }
                  })()

                  return (
                    <Card className={`space-y-4 ${it.flag ? 'bg-yellow-100' : ''}`} key={it.answerId ?? q.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-4 ">
                          <div>
                            <button
                              onClick={() => toggleFlag(q.id, it.flag)}
                              className="cursor-pointer"
                              aria-label={it.flag ? "Unflag question" : "Flag question"}
                            >
                              {it.flag ? (
                                <Flag
                                  className="h-5 w-[50px] text-red-500 cursor-pointer"
                                />
                              ) : (
                                <FlagOff
                                  className="h-5 w-[50px] text-gray-400 cursor-pointer"
                                />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center justify-between w-full">
                            <span>
                              {t("questionsLabel")} #{idx + 1}
                            </span>

                            <div>{headerStatus}</div>
                          </div>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{q.text}</div>

                        {hasOptions ? (
                          <div className="space-y-2">
                            {opts.map((op: any) => {
                              const isCorrect = op.id === correctId
                              const selectedId = it.selected?.id
                              const isSelected = selectedId != null && op.id === selectedId

                              return (
                                <div
                                  key={op.id}
                                  className={`break-words [overflow-wrap:anywhere] px-4 py-3 rounded-xl border flex gap-3 ${isCorrect
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
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">{t("yourAnswer") ?? "Sənin cavabın"}</div>
                              <div className="whitespace-pre-wrap rounded-xl border p-4 bg-white break-words [overflow-wrap:anywhere]">{it.studentTextAnswer ?? "-"}</div>
                            </div>

                            {it.feedback && (
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">{t("feedback") ?? "Qeydlər"}</div>
                                <div className="whitespace-pre-wrap rounded-xl border p-4 bg-white break-words [overflow-wrap:anywhere]">{it.feedback}</div>
                              </div>
                            )}

                            <div className="text-sm text-muted-foreground">
                              <b>{t("score") ?? "Qiymət"}:</b> {it.score != null ? it.score : (it.isCorrect == null ? (t("pending") ?? "Gözləmədə") : (it.isCorrect ? (t("correct") ?? "Düzgün") : (t("wrong") ?? "Yanlış")))}
                            </div>
                          </div>
                        )}

                        {/* bottom metadata */}
                        <div className="text-sm text-muted-foreground space-y-1">
                          {hasOptions ? (
                            <>
                              <div>
                                <b>{t("examRunner.badge.your_choice")}:</b> {it.selected?.text ?? "-"}
                              </div>
                              <div>
                                <b>{t("examRunner.ui.correct_answer")}:</b>{" "}
                                {q.correctOptionText ?? "-"}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
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
  yellow,
}: {
  label: string
  value?: number
  green?: boolean
  red?: boolean
  yellow?: boolean
}) {
  return (
    <div
      className={`px-4 py-2 rounded-xl ${green
        ? "bg-emerald-50"
        : red
          ? "bg-rose-50"
          : yellow
            ? "bg-yellow-50 border border-yellow-300"
            : "bg-violet-50"
        }`}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div
        className={`text-2xl font-bold ${yellow ? "text-yellow-700" : ""
          } justify-center flex`}
      >
        {value ?? 0}
      </div>
    </div>
  )
}
