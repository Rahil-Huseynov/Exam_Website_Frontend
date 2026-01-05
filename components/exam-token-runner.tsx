"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type ExamQuestion, type AttemptAnswer, type AttemptSummary } from "@/lib/api"
import { toast } from "react-toastify"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle2, ChevronLeft, ChevronRight, Flag, Loader2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ExamTokenRunner({ attemptId, userId }: { attemptId: string; userId: number }) {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedByQ, setSelectedByQ] = useState<Record<string, string>>({})
  const [savingAnswer, setSavingAnswer] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const [summary, setSummary] = useState<AttemptSummary | null>(null)
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, AttemptAnswer>>({})
  const [reviewMode, setReviewMode] = useState(false)

  const total = questions.length
  const answeredCount = Object.keys(selectedByQ).length
  const progress = total ? Math.round((answeredCount / total) * 100) : 0

  const currentQ = questions[activeIndex]
  const isFirst = activeIndex === 0
  const isLast = activeIndex === total - 1

  const isFinished = summary?.status === "FINISHED"

  useEffect(() => {
    if (!attemptId) return

      ; (async () => {
        try {
          const summary = await api.getAttemptSummary(attemptId)

          if (summary?.status === "FINISHED") {
            router.replace(`/results/${attemptId}`)
          }
        } catch {
        }
      })()
  }, [attemptId, router])


  useEffect(() => {
    if (!attemptId) return
    void loadQuestions()
  }, [attemptId])

  async function loadQuestions() {
    try {
      setLoading(true)
      setQuestions([])
      setActiveIndex(0)
      setSelectedByQ({})
      setSummary(null)
      setReviewMode(false)
      setReviewAnswers({})

      const res = await api.getAttemptQuestions(attemptId, userId)
      const list = Array.isArray(res?.questions) ? res.questions : []
      setQuestions(list)

      if (!list.length) toast.info(t("examRunner.toast.no_questions"))
    } catch (e: any) {
      toast.error(e?.message || t("examRunner.toast.load_failed"))
    } finally {
      setLoading(false)
    }
  }

  async function selectOption(questionId: string, optionId: string) {
    if (!attemptId) return
    if (summary?.status === "FINISHED") return

    setSelectedByQ((prev) => ({ ...prev, [questionId]: optionId }))

    try {
      setSavingAnswer(true)
      await api.answerAttempt(attemptId, questionId, optionId)
    } catch (e: any) {
      setSelectedByQ((prev) => {
        const copy = { ...prev }
        delete copy[questionId]
        return copy
      })
      toast.error(e?.message || t("examRunner.toast.answer_failed"))
    } finally {
      setSavingAnswer(false)
    }
  }

  async function finishExam() {
    if (!attemptId) {
      toast.error(t("examRunner.toast.no_attempt"))
      return
    }
    if (summary?.status === "FINISHED") return

    try {
      setFinishing(true)

      await api.finishAttempt(attemptId)

      const s = await api.getAttemptSummary(attemptId)
      setSummary(s)

      const res = await api.getAttemptAnswers(attemptId)
      const list: AttemptAnswer[] = Array.isArray(res?.answers) ? res.answers : []

      const map: Record<string, AttemptAnswer> = {}
      for (const a of list) map[a.questionId] = a
      setReviewAnswers(map)

      setReviewMode(true)
      setActiveIndex(0)

      toast.success(t("examRunner.toast.finished_showing_results"))
    } catch (e: any) {
      toast.error(e?.message || t("examRunner.toast.finish_failed"))
    } finally {
      setFinishing(false)
    }
  }

  function goTo(index: number) {
    if (index < 0 || index >= total) return
    setActiveIndex(index)
  }

  function leftBtnClass(questionId: string, active: boolean) {
    if (!isFinished) {
      const hasSelected = !!selectedByQ[questionId]
      return cn(
        active && "ring-2 ring-primary",
        hasSelected
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white",
      )
    }

    const ans = reviewAnswers[questionId]
    if (!ans) {
      return cn(
        active && "ring-2 ring-primary",
        "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white",
      )
    }

    return cn(
      active && "ring-2 ring-primary",
      ans.isCorrect ? "bg-emerald-600 text-white border-emerald-600" : "bg-red-600 text-white border-red-600",
    )
  }

  const titleStats = useMemo(() => {
    if (!isFinished || !summary) return null

    const stats = (summary as any).stats as
      | { answered?: number; correct?: number; wrong?: number; unanswered?: number }
      | undefined

    return {
      correct: stats?.correct ?? 0,
      wrong: stats?.wrong ?? 0,
      empty: stats?.unanswered ?? 0,
      total: (summary as any).total ?? total,
    }
  }, [isFinished, summary, total])

  if (loading) {
    return (
      <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-950/80 border-white/20 shadow-2xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
          <p className="mt-4">{t("examRunner.ui.loading")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-950/80 border-white/20 shadow-xl h-fit lg:sticky lg:top-24">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{t("examRunner.ui.question_list")}</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-6">
            {questions.map((q, i) => {
              const active = i === activeIndex
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-10 rounded-xl border text-sm font-semibold transition-all",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    leftBtnClass(q.id, active),
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            {!isFinished ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-600" />
                  <span>{t("examRunner.legend.selected")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded bg-black dark:bg-white" />
                  <span>{t("examRunner.legend.not_selected")}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-600" />
                  <span>{t("examRunner.legend.correct")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded bg-red-600" />
                  <span>{t("examRunner.legend.wrong")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded bg-black dark:bg-white" />
                  <span>{t("examRunner.legend.empty")}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {titleStats && (
          <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-950/85 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                {t("examRunner.result.title")}
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">{t("examRunner.result.correct")}</div>
                <div className="text-2xl font-bold">{titleStats.correct}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">{t("examRunner.result.wrong")}</div>
                <div className="text-2xl font-bold">{titleStats.wrong}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">{t("examRunner.result.total")}</div>
                <div className="text-2xl font-bold">{titleStats.total}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentQ ? (
          <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-950/85 border-white/20 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {activeIndex + 1}. {currentQ.text}
              </CardTitle>

              <div className="text-xs text-muted-foreground">
                {savingAnswer ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("examRunner.ui.answer_saving")}
                  </span>
                ) : isFinished ? (
                  reviewAnswers[currentQ.id]?.isCorrect ? (
                    <span className="inline-flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("examRunner.ui.correct_answer")}
                    </span>
                  ) : reviewAnswers[currentQ.id] ? (
                    <span className="inline-flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {t("examRunner.ui.wrong_answer")}
                    </span>
                  ) : (
                    <span>{t("examRunner.ui.empty_left")}</span>
                  )
                ) : (
                  <span>
                    {selectedByQ[currentQ.id] ? t("examRunner.ui.answer_selected") : t("examRunner.ui.answer_not_selected")}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {currentQ.options?.map((o) => {
                const ans = reviewAnswers[currentQ.id]
                const correctId = ans?.question?.correctOptionId
                const selectedId = isFinished ? ans?.selectedOptionId : selectedByQ[currentQ.id]

                const selected = selectedId === o.id
                const isCorrectOption = isFinished && correctId === o.id
                const isWrongSelected = isFinished && selected && !!correctId && correctId !== o.id

                const disabled = finishing || summary?.status === "FINISHED"

                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => void selectOption(currentQ.id, o.id)}
                    className={cn(
                      "w-full text-left rounded-2xl border p-4 transition-all",
                      !isFinished &&
                      "hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 hover:bg-gradient-to-r hover:from-violet-50 hover:to-blue-50 dark:hover:from-violet-950/20 dark:hover:to-blue-950/20",
                      selected && !isFinished && "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
                      isCorrectOption && "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
                      isWrongSelected && "border-red-600 bg-red-50 dark:bg-red-950/20",
                      disabled && "opacity-95 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm leading-relaxed">{o.text}</div>

                      {isFinished ? (
                        <>
                          {isCorrectOption && (
                            <span className="text-emerald-600 text-xs font-semibold">{t("examRunner.badge.correct")}</span>
                          )}
                          {isWrongSelected && (
                            <span className="text-red-600 text-xs font-semibold">{t("examRunner.badge.your_choice")}</span>
                          )}
                        </>
                      ) : (
                        selected && <span className="text-emerald-600 text-xs font-semibold">{t("examRunner.badge.selected")}</span>
                      )}
                    </div>
                  </button>
                )
              })}

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveIndex((x) => Math.max(0, x - 1))}
                  disabled={isFirst || finishing}
                  className="rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t("examRunner.ui.prev")}
                </Button>

                {!isLast ? (
                  <Button
                    onClick={() => setActiveIndex((x) => Math.min(total - 1, x + 1))}
                    disabled={finishing}
                    className="rounded-xl"
                  >
                    {t("examRunner.ui.next")}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => void finishExam()}
                    disabled={finishing || summary?.status === "FINISHED"}
                    className="rounded-xl"
                  >
                    {finishing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("examRunner.ui.finishing")}
                      </>
                    ) : (
                      <>
                        <Flag className="h-4 w-4 mr-2" />
                        {t("examRunner.ui.finish_exam")}
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{t("examRunner.ui.progress")}</span>
                  <span>{t("examRunner.ui.progress_stats", { answered: answeredCount, total, percent: progress })}</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-950/85 border-white/20 shadow-xl">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("examRunner.ui.no_question")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
