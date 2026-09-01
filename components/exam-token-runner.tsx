"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type ExamQuestion, type AttemptAnswer, type AttemptSummary } from "@/lib/api"
import { toast } from "react-toastify"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle2, ChevronLeft, ChevronRight, Flag, Loader2, XCircle, Clock, FlagOff } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  deleteCookie_EXAM_DURATION_COOKIE,
  EXAM_DURATION_COOKIE,
  getCookie_EXAM_DURATION_COOKIE,
} from "@/helper/ExamDurationMinutesHelper"
import HTMLEncodedReader from "@/lib/HTML-encodedReader"
import { SimpleMathEditor } from "./simple-math-editor"

type SafeErr = any

function parseServerError(err: SafeErr) {
  try {
    if (!err) return "Unknown error"
    if (typeof err === "string") return err
    if (err instanceof Error) return err.message || String(err)
    if (err.response?.data) {
      const d = err.response.data
      if (typeof d === "string") return d
      if (Array.isArray(d.message)) return d.message.join(", ")
      if (typeof d.message === "string") return d.message
      if (d.error) return String(d.error)
      return JSON.stringify(d)
    }
    if (typeof err === "object" && err.message) {
      if (Array.isArray(err.message)) return err.message.join(", ")
      if (typeof err.message === "string") return err.message
    }
    if (err.raw && typeof err.raw === "object" && err.raw.message) {
      return Array.isArray(err.raw.message) ? err.raw.message.join(", ") : String(err.raw.message)
    }
    return JSON.stringify(err)
  } catch {
    return "Unknown error"
  }
}

export default function ExamTokenRunner({
  attemptId,
  userId,
  onFinished,
}: {
  attemptId: string
  userId: number
  onFinished?: () => void
}) {
  const cookieDuration = getCookie_EXAM_DURATION_COOKIE(EXAM_DURATION_COOKIE) || "60"
  const FALLBACK_DURATION_SEC = Number(cookieDuration) * 60

  function formatTime(totalSec: number) {
    const sec = Math.max(0, totalSec)
    const mm = Math.floor(sec / 60)
    const ss = sec % 60
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
  }

  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const router = useRouter()
  const BASE = process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedByQ, setSelectedByQ] = useState<Record<string, string>>({})
  const [savingAnswer, setSavingAnswer] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [flagByQ, setFlagByQ] = useState<Record<string, boolean>>({})

  const [summary, setSummary] = useState<AttemptSummary | null>(null)
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, AttemptAnswer>>({})
  const [reviewMode, setReviewMode] = useState(false)

  const [remainingSec, setRemainingSec] = useState<number>(FALLBACK_DURATION_SEC)
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null)
  const [clockOffsetMs, setClockOffsetMs] = useState<number>(0)  
  const intervalRef = useRef<number | null>(null)
  const autoFinishedRef = useRef(false)

  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished

  function stopTimer() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function calcRemaining(endMs: number, offset: number) {
    const nowServer = Date.now() + offset
    return Math.floor((endMs - nowServer) / 1000)
  }

  function startOrResumeTimer(serverExpiresAt?: string | Date | null, serverNow?: string | null) {
    if (!attemptId) return
    if (summary?.status === "FINISHED") return

    let endMs: number | null = null
    let offset = clockOffsetMs

    if (serverExpiresAt) {
      endMs = new Date(serverExpiresAt).getTime()
    } else if (expiresAtMs) {
      endMs = expiresAtMs
    }

    if (serverNow) {
      const serverMs = new Date(serverNow).getTime()
      offset = serverMs - Date.now()
      setClockOffsetMs(offset)
    }

    if (!endMs || Number.isNaN(endMs)) {
      endMs = Date.now() + offset + FALLBACK_DURATION_SEC * 1000
    }

    setExpiresAtMs(endMs)

    const tick = () => {
      const left = calcRemaining(endMs!, offset)
      setRemainingSec(left)

      if (left <= 0 && !autoFinishedRef.current) {
        autoFinishedRef.current = true
        stopTimer()
        void finishExam()
      }
    }

    tick()
    stopTimer()
    intervalRef.current = window.setInterval(tick, 1000)
  }

  useEffect(() => {
    if (!attemptId) return
    if (loading) return
    if (!questions.length) return
    if (summary?.status === "FINISHED") return
    startOrResumeTimer()
    return () => stopTimer()
  }, [attemptId, loading, questions.length, summary?.status, expiresAtMs, clockOffsetMs])

  useEffect(() => {
    if (summary?.status === "FINISHED") {
      stopTimer()
    }
  }, [summary?.status])

  const total = questions.length
  const answeredCount = Object.keys(selectedByQ).filter((qid) => {
    const v = selectedByQ[qid]
    return v !== undefined && v !== null && String(v).trim() !== ""
  }).length
  const progress = total ? Math.round((answeredCount / total) * 100) : 0

  useEffect(() => {
    if (activeIndex >= questions.length && questions.length > 0) {
      setActiveIndex(Math.max(0, questions.length - 1))
    }
    if (questions.length === 0) setActiveIndex(0)
  }, [questions, activeIndex])

  const currentQ = questions[activeIndex] ?? null
  const isFirst = activeIndex === 0
  const isLast = activeIndex === total - 1
  const isFinished = summary?.status === "FINISHED"
  const flaggedCount = Object.values(flagByQ).filter(Boolean).length

  useEffect(() => {
    if (!attemptId) return
    let cancelled = false
    ;(async () => {
      try {
        const raw = await api.getAttemptSummary(attemptId)
        const s = (raw as any)?.data ?? raw
        if (cancelled) return
        if (String(s?.status || "").toUpperCase() === "FINISHED") {
          onFinishedRef.current?.()
          router.replace(`/results/${attemptId}`)
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [attemptId])

  useEffect(() => {
    if (!attemptId) return
    void loadQuestions()
  }, [attemptId])

  async function loadQuestions() {
    setLoading(true)
    setQuestions([])
    setActiveIndex(0)
    setSelectedByQ({})
    setSummary(null)
    setReviewMode(false)
    setReviewAnswers({})
    setFlagByQ({})
    autoFinishedRef.current = false
    setExpiresAtMs(null)
    setRemainingSec(FALLBACK_DURATION_SEC)
    setClockOffsetMs(0)

    try {
      try {
        const rawSummary = await api.getAttemptSummary(attemptId)
        const s = (rawSummary as any)?.data ?? rawSummary

        if (String(s?.status || "").toUpperCase() === "FINISHED") {
          onFinishedRef.current?.()
          router.replace(`/results/${attemptId}`)
          return
        }

        if (s?.expiresAt) {
          const end = new Date(s.expiresAt).getTime()
          setExpiresAtMs(end)

          if (s.serverNow) {
            const offset = new Date(s.serverNow).getTime() - Date.now()
            setClockOffsetMs(offset)
            const left = calcRemaining(end, offset)
            setRemainingSec(Math.max(0, left))
          } else {
            const left = Math.floor((end - Date.now()) / 1000)
            setRemainingSec(Math.max(0, left))
          }
        }
      } catch {
      }

      const res = await api.getAttemptQuestions(attemptId, userId)
      const list = Array.isArray(res?.questions) ? res.questions : []
      setQuestions(list)

      if ((res as any)?.expiresAt) {
        const end = new Date((res as any).expiresAt).getTime()
        setExpiresAtMs(end)

        const serverNow = (res as any)?.serverNow
        if (serverNow) {
          const offset = new Date(serverNow).getTime() - Date.now()
          setClockOffsetMs(offset)
          const left = calcRemaining(end, offset)
          setRemainingSec(Math.max(0, left))
          startOrResumeTimer((res as any).expiresAt, serverNow)
        } else {
          const left = Math.floor((end - Date.now()) / 1000)
          setRemainingSec(Math.max(0, left))
        }
      }

      const sel: Record<string, string> = {}
      const flags: Record<string, boolean> = {}
      for (const q of list) {
        if ((q as any).selectedOptionId) sel[q.id] = (q as any).selectedOptionId
        else if ((q as any).studentTextAnswer) sel[q.id] = (q as any).studentTextAnswer
        else sel[q.id] = ""
        flags[q.id] = !!(q as any).flag
      }
      setSelectedByQ(sel)
      setFlagByQ(flags)

      if (!list.length) toast.info(t("examRunner.toast.no_questions"))
    } catch (e) {
      toast.error(parseServerError(e))
    } finally {
      setLoading(false)
    }
  }

  async function selectOption(questionId: string, optionId: string) {
    if (!attemptId) return
    if (summary?.status === "FINISHED") return

    const prev = selectedByQ[questionId]
    setSelectedByQ((p) => ({ ...p, [questionId]: optionId }))

    try {
      setSavingAnswer(true)
      const flag = !!flagByQ[questionId]
      await api.answerAttempt(attemptId, questionId, optionId, undefined, flag)
    } catch (e) {
      setSelectedByQ((p) => ({ ...p, [questionId]: prev ?? "" }))
      toast.error(parseServerError(e))
    } finally {
      setSavingAnswer(false)
    }
  }

  async function saveTextAnswer(questionId: string) {
    if (!attemptId) return
    if (summary?.status === "FINISHED") return

    const text = String(selectedByQ[questionId] ?? "").trim()
    if (text === "") {
      toast.info(t("examRunner.toast.enter_answer") || "Cavab yazın")
      return
    }

    try {
      setSavingAnswer(true)
      const flag = !!flagByQ[questionId]
      await api.answerAttempt(attemptId, questionId, undefined, text, flag)
      toast.success(t("examRunner.toast.answer_saved") || "Cavab yadda saxlandı")
    } catch (e) {
      toast.error(parseServerError(e))
    } finally {
      setSavingAnswer(false)
    }
  }

  async function toggleFlag(questionId: string, value: boolean) {
    setFlagByQ((p) => ({ ...p, [questionId]: value }))

    const selectedValue = selectedByQ[questionId] ?? ""
    const opts = questions.find((q) => q.id === questionId)?.options
    const isTest = Array.isArray(opts) && opts.length > 0

    try {
      if (selectedValue && selectedValue.trim() !== "") {
        if (isTest) {
          await api.answerAttempt(attemptId, questionId, selectedValue, undefined, value)
        } else {
          await api.answerAttempt(attemptId, questionId, undefined, selectedValue, value)
        }
      } else {
        await api.setFlagAttempt(attemptId, questionId, value)
      }
    } catch (e) {
      setFlagByQ((p) => ({ ...p, [questionId]: !value }))
      toast.error(parseServerError(e))
    }
  }

  async function finishExam() {
    if (!attemptId) {
      toast.error(t("examRunner.toast.no_attempt") || "Attempt not found")
      return
    }
    if (summary?.status === "FINISHED") return
    if (finishing) return

    try {
      setFinishing(true)

      const writingQs = questions.filter(
        (q) => !Array.isArray(q.options) || q.options.length === 0,
      )
      const saves: Promise<any>[] = []
      for (const q of writingQs) {
        const val = String(selectedByQ[q.id] ?? "").trim()
        if (val !== "") {
          const flag = !!flagByQ[q.id]
          saves.push(api.answerAttempt(attemptId, q.id, undefined, val, flag))
        }
      }

      if (saves.length) {
        await Promise.allSettled(saves).then((results) => {
          const rejected = results.filter((r) => r.status === "rejected")
          if (rejected.length) {
            const firstErr = (rejected[0] as PromiseRejectedResult).reason
            toast.warn(parseServerError(firstErr))
          }
        })
      }

      const writingOnly =
        questions.length > 0 &&
        questions.every((q) => !Array.isArray(q.options) || q.options.length === 0)

      const missing = questions.filter((q) => {
        const v = selectedByQ[q.id]
        return !(v !== undefined && v !== null && String(v).trim() !== "")
      })

      if (missing.length > 0 && !writingOnly) {
        toast.info(
          t("examRunner.toast.finish_with_unanswered", { count: missing.length }) ||
            `Diqqət: ${missing.length} sual cavablanmayıb. İmtahanı bitirəndən sonra boş qalanlar düzgün hesablanacaq.`,
        )
      }

      await api.finishAttempt(attemptId)

      const raw = await api.getAttemptSummary(attemptId)
      const s = ((raw as any)?.data ?? raw) as AttemptSummary
      setSummary(s)
      onFinishedRef.current?.()

      const res = await api.getAttemptAnswers(attemptId)
      const list: AttemptAnswer[] = Array.isArray(res?.answers) ? res.answers : []
      const map: Record<string, AttemptAnswer> = {}
      for (const a of list) map[a.questionId] = a
      setReviewAnswers(map)

      if (writingOnly) {
        toast.success(t("examRunner.toast.finished_showing_results") || "Imtahan tamamlandı")
        deleteCookie_EXAM_DURATION_COOKIE(EXAM_DURATION_COOKIE)
        router.replace(`/results`)
        return
      }

      setReviewMode(true)
      setActiveIndex(0)

      toast.success(t("examRunner.toast.finished_showing_results") || "Imtahan tamamlandı")
      deleteCookie_EXAM_DURATION_COOKIE(EXAM_DURATION_COOKIE)
    } catch (e) {
      toast.error(parseServerError(e))
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
      const hasSelected = !!(selectedByQ[questionId] && String(selectedByQ[questionId]).trim() !== "")
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

  if (!currentQ) {
    return (
      <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-950/85 border-white/20 shadow-xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t("examRunner.ui.no_question")}
          <div className="mt-4">
            <Button variant="outline" onClick={() => void loadQuestions()}>
              Yenidən yüklə
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isFlagged = !!flagByQ[currentQ.id]

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
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full border border-primary flex items-center justify-center text-[10px] font-semibold text-primary">
                    ⚑
                  </span>
                  <span>
                    {t("examRunner.result.total.flag")}: {flaggedCount}
                  </span>
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

          {!isFinished && (
            <div className="mt-5 rounded-2xl border p-4 bg-white/60 dark:bg-gray-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{t("examRunner.ui.time_left") ?? "Qalan vaxt"}</span>
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    remainingSec <= 60 && "text-red-600",
                  )}
                >
                  {formatTime(remainingSec)}
                </div>
              </div>
              {remainingSec <= 60 && (
                <div className="mt-2 text-[11px] text-red-600">
                  {t("examRunner.ui.last_minute_warning") ?? "Son 1 dəqiqə!"}
                </div>
              )}
            </div>
          )}
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

        <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-950/85 border-white/20 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              <div className="flex items-center gap-3">
                {isFlagged ? (
                  <Flag
                    className="h-5 w-[50px] text-red-500 cursor-pointer"
                    onClick={() => toggleFlag(currentQ.id, false)}
                  />
                ) : (
                  <FlagOff
                    className="h-5 w-[50px] text-gray-400 cursor-pointer"
                    onClick={() => toggleFlag(currentQ.id, true)}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div>{activeIndex + 1}.</div>
                  <div>
                    <HTMLEncodedReader content={currentQ.text} />
                  </div>
                </div>
              </div>
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
                  {selectedByQ[currentQ.id] && String(selectedByQ[currentQ.id]).trim() !== ""
                    ? t("examRunner.ui.answer_selected")
                    : t("examRunner.ui.answer_not_selected")}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {Array.isArray((currentQ as any).images) && (currentQ as any).images.length > 0 && (
              <div className="space-y-3">
                {(currentQ as any).images
                  .slice()
                  .sort((a: any, b: any) => (a?.sort ?? 0) - (b?.sort ?? 0))
                  .map((im: any) => (
                    <img
                      key={im.id || im.url}
                      src={`${BASE}${im.url}`}
                      alt="question"
                      className="w-full object-contain rounded-2xl border bg-white"
                    />
                  ))}
              </div>
            )}

            {Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
              currentQ.options.map((o) => {
                const ans = reviewAnswers[currentQ.id]
                const correctId = ans?.question?.correctOptionId
                const selectedId = isFinished ? ans?.selectedOptionId : selectedByQ[currentQ.id]
                const selected = selectedId === o.id
                const isCorrectOption = isFinished && correctId === o.id
                const isWrongSelected = isFinished && selected && !!correctId && correctId !== o.id
                const timeUp = remainingSec <= 0
                const disabled = finishing || summary?.status === "FINISHED" || timeUp

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
                      <div className="text-sm leading-relaxed">
                        <HTMLEncodedReader content={o.text} />
                      </div>
                      {isFinished ? (
                        <>
                          {isCorrectOption && (
                            <span className="text-emerald-600 text-xs font-semibold">
                              {t("examRunner.badge.correct")}
                            </span>
                          )}
                          {isWrongSelected && (
                            <span className="text-red-600 text-xs font-semibold">
                              {t("examRunner.badge.your_choice")}
                            </span>
                          )}
                        </>
                      ) : (
                        selected && (
                          <span className="text-emerald-600 text-xs font-semibold">
                            {t("examRunner.badge.selected")}
                          </span>
                        )
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="space-y-3">
                <SimpleMathEditor
                  value={selectedByQ[currentQ.id] ?? ""}
                  onChange={(val) => setSelectedByQ((p) => ({ ...p, [currentQ.id]: val }))}
                  placeholder={t("examRunner.ui.enter_text_answer") || "Cavabınızı bura yazın..."}
                  className="w-full min-h-[200px] rounded-2xl border p-4 resize-vertical"
                />
                {!isFinished && (
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    disabled={savingAnswer || finishing}
                    onClick={() => void saveTextAnswer(currentQ.id)}
                  >
                    {savingAnswer ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("examRunner.ui.answer_saving")}
                      </>
                    ) : (
                      t("examRunner.ui.save_answer") || "Cavabı yadda saxla"
                    )}
                  </Button>
                )}
              </div>
            )}

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
                <span>
                  {t("examRunner.ui.progress_stats", {
                    answered: answeredCount,
                    total,
                    percent: progress,
                  })}
                </span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}