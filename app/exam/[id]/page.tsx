"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type Question } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Clock, ChevronLeft, ChevronRight, Trophy } from "lucide-react"

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(3600) 
  const [result, setResult] = useState<{ score: number; totalQuestions: number } | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  useEffect(() => {
    if (loading || result) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, result])

  async function loadQuestions() {
    try {
      setLoading(true)
      const data = await api.getExamQuestions(Number(resolvedParams.id))
      setQuestions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exam")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    try {
      setSubmitting(true)
      const resultData = await api.submitExam(Number(resolvedParams.id), answers)
      setResult(resultData)
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit exam")
    } finally {
      setSubmitting(false)
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  if (result) {
    const percentage = (result.score / result.totalQuestions) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  {t("examComplete")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">{t("yourScore")}</p>
                  <div className="relative inline-block">
                    <div className="text-7xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {percentage.toFixed(0)}%
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-violet-400/20 to-blue-400/20 rounded-full blur-2xl -z-10"></div>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    {t("correctAnswers")}: <span className="font-bold text-violet-600">{result.score}</span> {t("of")}{" "}
                    {result.totalQuestions}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                  >
                    {t("backToDashboard")}
                  </Button>
                  <Button onClick={() => router.push("/results")} variant="outline" className="w-full h-12 border-2">
                    {t("reviewAnswers")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              {locale === "az" && "İmtahan sualları tapılmadı"}
              {locale === "en" && "No exam questions found"}
              {locale === "ru" && "Вопросы экзамена не найдены"}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("questionNumber")} {currentQuestion + 1} {t("of")} {questions.length}
              </p>
              <Progress value={progress} className="w-48" />
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-950/90 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-balance leading-relaxed">{question.text}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[question.id]?.toString()}
                onValueChange={(value) => setAnswers({ ...answers, [question.id]: Number(value) })}
              >
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 border-2 rounded-xl hover:bg-gradient-to-r hover:from-violet-50 hover:to-blue-50 dark:hover:from-violet-950/20 dark:hover:to-blue-950/20 transition-all hover:border-violet-300 cursor-pointer"
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} className="h-5 w-5" />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              disabled={currentQuestion === 0}
              className="h-11 border-2"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t("previous")}
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="min-w-32 h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  t("finishExam")
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
              >
                {t("next")}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
