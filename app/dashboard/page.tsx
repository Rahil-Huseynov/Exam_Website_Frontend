"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import { api, type University, type Exam } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import {
  BookOpen,
  TrendingUp,
  Wallet,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  CalendarDays,
  Search,
  CheckCircle2,
  Sparkles,
  User,
} from "lucide-react"

import { toastError } from "@/lib/toast"
import { fromCents, toCents } from "@/lib/utils"
import {
  deleteCookie_EXAM_DURATION_COOKIE,
  EXAM_DURATION_COOKIE,
  setCookie_EXAM_DURATION_COOKIE,
} from "@/helper/ExamDurationMinutesHelper"
import Image from "next/image"

type Attempt = any
type Step = 1 | 2 | 3

function getDisplayName(user: any, locale: string) {
  if (!user) return locale === "ru" ? "Пользователь" : locale === "en" ? "User" : "İstifadəçi"
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return (
    full ||
    user.name ||
    user.email ||
    (locale === "ru" ? "Пользователь" : locale === "en" ? "User" : "İstifadəçi")
  )
}

function tName(obj: any, locale: string) {
  if (!obj) return ""
  if (locale === "az") return obj.nameAz || obj.name
  if (locale === "ru") return obj.nameRu || obj.name
  return obj.nameEn || obj.name
}

function tokenBankKey(token: string) {
  return `exam_token_bank_${token}`
}

function setTokenBank(token: string, bankId: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(tokenBankKey(token), bankId)
}

function approxCount(value?: number) {
  if (value === undefined || value === null || value <= 0) return "-"
  const rounded = Math.floor(value / 10) * 10
  return `${rounded}+`
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const lastErrorRef = useRef<string>("")
  const didLoadRef = useRef(false)

  const [step, setStep] = useState<Step>(1)
  const [universities, setUniversities] = useState<University[]>([])
  const [uniLoading, setUniLoading] = useState(false)
  const [selectedUni, setSelectedUni] = useState<University | null>(null)
  const [years, setYears] = useState<number[]>([])
  const [yearsLoading, setYearsLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [examsLoading, setExamsLoading] = useState(false)
  const [q, setQ] = useState("")
  const [startingId, setStartingId] = useState<string>("")

  const stepRef = useRef(step)
  const selectedUniRef = useRef(selectedUni)
  const selectedYearRef = useRef(selectedYear)

  useEffect(() => {
    stepRef.current = step
  }, [step])
  useEffect(() => {
    selectedUniRef.current = selectedUni
  }, [selectedUni])
  useEffect(() => {
    selectedYearRef.current = selectedYear
  }, [selectedYear])

  const base = "transition-all duration-300 ease-out"
  const active = "opacity-100 translate-x-0"
  const hiddenLeft = "opacity-0 -translate-x-6 pointer-events-none absolute inset-0"
  const hiddenRight = "opacity-0 translate-x-6 pointer-events-none absolute inset-0"

  const wizardRef = useRef<HTMLDivElement | null>(null)
  const didAutoScrollRef = useRef(false)

  function scrollToWizard() {
    if (typeof window === "undefined") return
    const el = wizardRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  useEffect(() => {
    if (!didAutoScrollRef.current) {
      didAutoScrollRef.current = true
      return
    }
    scrollToWizard()
  }, [step])

  const pushWizardState = useCallback(
    (next: Step, extra?: Partial<{ uni: University | null; year: number | null }>) => {
      if (typeof window === "undefined") return
      const state = {
        __wizard: true,
        step: next,
        uni: extra?.uni ?? selectedUniRef.current,
        year: extra?.year ?? selectedYearRef.current,
      }
      window.history.pushState(state, "")
    },
    [],
  )

  const replaceWizardState = useCallback(
    (next: Step, extra?: Partial<{ uni: University | null; year: number | null }>) => {
      if (typeof window === "undefined") return
      const state = {
        __wizard: true,
        step: next,
        uni: extra?.uni ?? selectedUniRef.current,
        year: extra?.year ?? selectedYearRef.current,
      }
      window.history.replaceState(state, "")
    },
    [],
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!window.history.state?.__wizard) {
      replaceWizardState(1, { uni: null, year: null })
    }

    const onPopState = (e: PopStateEvent) => {
      const st: any = e.state

      if (!st?.__wizard) {
        const currentStep = stepRef.current
        if (currentStep === 3) {
          setStep(2)
          setSelectedYear(null)
          setExams([])
          setQ("")
          replaceWizardState(2, { year: null })
          return
        }
        if (currentStep === 2) {
          setStep(1)
          setSelectedUni(null)
          setSelectedYear(null)
          setYears([])
          setExams([])
          setQ("")
          replaceWizardState(1, { uni: null, year: null })
          return
        }
        return
      }

      const nextStep: Step = st.step || 1
      const uni: University | null = st.uni ?? null
      const year: number | null = st.year ?? null

      setStep(nextStep)
      setSelectedUni(uni)
      setSelectedYear(year)

      if (nextStep < 3) {
        setExams([])
        setQ("")
      }
      if (nextStep < 2) {
        setYears([])
        setExams([])
        setQ("")
        setSelectedYear(null)
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [replaceWizardState])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setUniLoading(true)
        const list = await api.getUniversities()
        if (!cancelled) setUniversities(Array.isArray(list) ? list : [])
      } catch (e: any) {
        toastError(e?.message || t("errUniversitiesLoad"))
      } finally {
        if (!cancelled) setUniLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setLoading(false)
      router.replace("/login")
      return
    }

    if (didLoadRef.current) return
    didLoadRef.current = true

    ;(async () => {
      try {
        setLoading(true)
        const data = await api.getUserAttempts(user.id)
        setAttempts(Array.isArray((data as any)?.attempts) ? (data as any).attempts : [])
        lastErrorRef.current = ""
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : t("errDataLoad")
        if (lastErrorRef.current !== msg) {
          lastErrorRef.current = msg
          toastError(msg)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading, user, router, t])

  async function onSelectUniversity(u: University) {
    setSelectedUni(u)
    setSelectedYear(null)
    setYears([])
    setExams([])
    setQ("")
    setStep(2)

    pushWizardState(2, { uni: u, year: null })

    try {
      setYearsLoading(true)
      const ys = await api.getExamYearsByUniversity(u.id)
      setYears(Array.isArray(ys) ? ys : [])
    } catch (e: any) {
      toastError(e?.message || t("errYearsLoad"))
    } finally {
      setYearsLoading(false)
    }
  }

  async function onSelectYear(y: number) {
    if (!selectedUni) return

    setSelectedYear(y)
    setExams([])
    setQ("")
    setStep(3)

    pushWizardState(3, { year: y })

    try {
      setExamsLoading(true)
      const list = await api.getExamsByFilter(selectedUni.id, undefined, y)
      setExams(Array.isArray(list) ? list : [])
    } catch (e: any) {
      toastError(e?.message || t("errExamsLoad"))
    } finally {
      setExamsLoading(false)
    }
  }

  const apiBase = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_API_URL || ""
    return raw.replace(/\/+$/, "").replace(/\/api$/, "")
  }, [])

  function resolveLogoUrl(logo?: string | null) {
    if (!logo) return ""
    if (/^https?:\/\//i.test(logo)) return logo
    return `${apiBase}${logo.startsWith("/") ? "" : "/"}${logo}`
  }

  const filteredExams = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return exams
    return exams.filter((e: any) => {
      const title = String(e?.title || "").toLowerCase()
      const subj = String(e?.subject?.name || "").toLowerCase()
      return title.includes(s) || subj.includes(s)
    })
  }, [exams, q])

  const displayName = getDisplayName(user, locale)
  const balanceCents = toCents((user as any)?.balance)

  const completedAttempts = attempts.filter(
    (a) => a?.completedAt || a?.finishedAt || a?.status === "FINISHED",
  )

  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => {
          const score = Number(a?.score || 0)
          const total = Number(a?.totalQuestions || a?.total || 1)
          return sum + (score / (total || 1)) * 100
        }, 0) / completedAttempts.length
      : 0

  async function startExam(exam: Exam) {
    try {
      if (!user?.id) {
        toastError(t("errNotLoggedIn") || t("errLoginRequired"))
        router.push("/login")
        return
      }

      const priceCents = toCents((exam as any)?.price || 0)
      const balanceCentsNow = toCents((user as any)?.balance)

      if (balanceCentsNow < priceCents) {
        toastError(t("errNoBalance"))
        return
      }

      const bankId = String((exam as any).bankId ?? (exam as any).id ?? "")
      if (!bankId) {
        toastError(t("errBankNotFound"))
        return
      }

      setStartingId(bankId)

      deleteCookie_EXAM_DURATION_COOKIE(EXAM_DURATION_COOKIE)
      const duration = (exam as any).durationMinutes
      if (duration !== undefined && duration !== null && !Number.isNaN(Number(duration))) {
        setCookie_EXAM_DURATION_COOKIE(EXAM_DURATION_COOKIE, String(duration), Number(EXAM_DURATION_COOKIE))
      }

      const tok = await api.createExamToken(bankId, user.id)
      const token = String((tok as any)?.token || "")
      const attemptId = String((tok as any)?.attemptId || "")

      if (!token) {
        toastError(t("errTokenFail") || t("errTokenNotCreated"))
        return
      }

      setTokenBank(token, bankId)
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`exam_attempt_${token}`, attemptId)
      }

      router.push(`/exam-token/${token}`)
    } catch (e: any) {
      toastError(e?.message || t("errStartExam"))
    } finally {
      setStartingId("")
    }
  }

  async function retakeAttempt(attempt: Attempt) {
    const bank = attempt?.bank || attempt?.exam || null
    if (!bank) {
      toastError(t("errBankNotFound") || "Exam bank not found")
      return
    }

    const examLike = {
      id: bank.id,
      bankId: bank.id,
      price: bank.price ?? 0,
      durationMinutes: bank.durationMinutes ?? bank.duration ?? null,
    }

    await startExam(examLike as any)
  }

  function goBack() {
    if (typeof window !== "undefined") {
      window.history.back()
      return
    }

    if (step === 3) {
      setStep(2)
      setExams([])
      setQ("")
      setSelectedYear(null)
    } else if (step === 2) {
      setStep(1)
      setSelectedUni(null)
      setSelectedYear(null)
      setYears([])
      setExams([])
      setQ("")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-12 flex-1">
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
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-12 flex-1">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t("checkingAccount")}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const recentAttempts = attempts
    .filter((a) => a?.status !== "IN_PROGRESS")
    .slice()
    .sort(
      (a, b) =>
        new Date(b.startedAt || b.createdAt || 0).getTime() -
        new Date(a.startedAt || a.createdAt || 0).getTime(),
    )
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary/70 uppercase tracking-wide">
              <Sparkles className="h-4 w-4" />
              {t("dashboardPanel")}
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-balance tracking-tight">
              {t("welcome")}, <span className="text-primary">{displayName}</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">{t("dashboardSubtitle")}</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-xl hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("dashboardBalance")}
                </CardTitle>
                <Wallet className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{fromCents(balanceCents)} AZN</div>
                <Button asChild variant="link" className="px-0 h-auto mt-4 text-primary/70 hover:text-primary">
                  <Link href="/balance" className="flex items-center gap-1 text-sm">
                    {t("dashboardIncreaseBalance")}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-xl hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("userId")}</CardTitle>
                <User className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold break-all tracking-tight">{user.publicId}</div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-xl hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("dashboardCompletedExams")}
                </CardTitle>
                <BookOpen className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{completedAttempts.length}</div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-xl hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("dashboardAverageScore")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{Number(averageScore).toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Attempts */}
          <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">{t("recentAttempts") || "Son imtahanlar"}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {recentAttempts.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">{t("noRecentAttempts")}</div>
              ) : (
                <div className="grid gap-3">
                  {recentAttempts.map((a: any) => {
                    const showAIBadge = a?.bank?.type === "WRITING"
                    const isTest = a?.bank?.type === "TEST"
                    const bankId = String(a?.bank?.id || a?.exam?.id || "")

                    return (
                      <div
                        key={a.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-border/30 bg-background/30"
                      >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted/10 flex items-center justify-center overflow-hidden">
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE}${a?.bank?.university?.logo || ""}`}
                                alt={a?.bank?.university?.name || "University"}
                                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                                loading="lazy"
                              />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm leading-snug line-clamp-2">
                              {a?.bank?.title || a?.exam?.title || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">
                              {a?.bank?.university?.name} • {a?.bank?.year ?? "-"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(a.startedAt || a.createdAt || Date.now()).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              {showAIBadge ? (
                                <Image src="/ai.png" alt="AI" width={18} height={18} />
                              ) : isTest ? (
                                <Image src="/test.png" alt="Test" width={18} height={18} />
                              ) : (
                                <BookOpen className="h-4 w-4 text-primary/70" />
                              )}
                              <span>
                                {a?.bank?.type === "TEST"
                                  ? t("examTypeTest")
                                  : a?.bank?.type === "WRITING" || a?.bank?.type === "WRITTING"
                                    ? t("examTypeWritting")
                                    : "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="text-sm font-semibold whitespace-nowrap">
                            {a.score ?? "-"} / {a.total ?? "-"}
                          </div>

                          <div className="flex gap-2 ml-auto sm:ml-0">
                            <Button
                              size="sm"
                              onClick={() => retakeAttempt(a)}
                              disabled={startingId === bankId}
                              className="rounded-lg h-9 px-3 shadow-sm"
                            >
                              {startingId === bankId ? t("creatingToken") || "..." : t("retake")}
                            </Button>

                            <Link href={`/results/${a?.id}`}>
                              <Button variant="outline" size="sm" className="rounded-lg h-9 px-3">
                                {t("viewResults")}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wizard */}
          <div ref={wizardRef} className="scroll-mt-24">
            <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-6 border-b border-border/40">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      {t("dashboardWizardTitle")}
                    </CardTitle>
                    <CardDescription className="text-base">{t("dashboardWizardDesc")}</CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-lg px-3 py-1">
                      {t("step")} {step}/3
                    </Badge>

                    {step > 1 && (
                      <Button
                        variant="outline"
                        className="rounded-lg h-9 px-3 bg-transparent"
                        onClick={goBack}
                        size="sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        {t("goBack")}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-lg border border-border/40 bg-background/60 flex items-center gap-1.5">
                    <CheckCircle2 className={`h-4 w-4 ${step >= 1 ? "text-primary" : "text-muted-foreground/30"}`} />
                    {t("ExamType") || t("chooseExamType")}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg border border-border/40 bg-background/60 flex items-center gap-1.5">
                    <CheckCircle2 className={`h-4 w-4 ${step >= 2 ? "text-primary" : "text-muted-foreground/30"}`} />
                    {t("stepYear")}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg border border-border/40 bg-background/60 flex items-center gap-1.5">
                    <CheckCircle2 className={`h-4 w-4 ${step >= 3 ? "text-primary" : "text-muted-foreground/30"}`} />
                    {t("stepExams")}
                  </span>

                  {selectedUni && (
                    <span className="px-3 py-1.5 rounded-lg border border-border/40 bg-background/60 text-muted-foreground">
                      {t("selectedExamType")}:{" "}
                      <span className="font-medium text-foreground">{tName(selectedUni, locale)}</span>
                    </span>
                  )}
                  {selectedYear && (
                    <span className="px-3 py-1.5 rounded-lg border border-border/40 bg-background/60 text-muted-foreground">
                      {t("selectedYear")}: <span className="font-medium text-foreground">{selectedYear}</span>
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="relative min-h-[320px] pt-8">
                {/* STEP 1 */}
                <div className={[base, step === 1 ? active : hiddenLeft].join(" ")}>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="font-semibold text-lg">{t("chooseExamType")}</div>
                    {uniLoading && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        {t("loading")}
                      </div>
                    )}
                  </div>

                  {universities.length === 0 && !uniLoading ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">{t("noUniversities")}</div>
                  ) : (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {universities.map((u) => {
                        const name = tName(u, locale)
                        const logoUrl = resolveLogoUrl((u as any)?.logo)

                        return (
                          <button
                            key={u.id}
                            onClick={() => onSelectUniversity(u)}
                            className="group aspect-square rounded-lg border border-border/40 p-4 text-left bg-card/50 hover:border-primary/50 hover:bg-card hover:shadow-md transition-all flex flex-col"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-sm leading-snug line-clamp-2">{name}</div>
                            </div>

                            <div className="mt-3 flex-1 flex items-center justify-center">
                              <div className="w-full h-28 rounded-md border border-border/40 bg-background/50 overflow-hidden flex items-center justify-center">
                                {logoUrl ? (
                                  <img
                                    src={logoUrl || "/placeholder.svg"}
                                    alt={name}
                                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
                                  />
                                ) : (
                                  <div className="text-xs text-muted-foreground">—</div>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{t("continue")}</span>
                              <ArrowRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity text-primary" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* STEP 2 */}
                <div className={[base, step === 2 ? active : step < 2 ? hiddenRight : hiddenLeft].join(" ")}>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="font-semibold text-lg flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {t("chooseYear")}
                    </div>
                  </div>

                  {yearsLoading ? (
                    <div className="text-sm text-muted-foreground flex items-center gap-2 py-8">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      {t("yearsLoading")}
                    </div>
                  ) : years.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">{t("noYears")}</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">{t("yearHint")}</div>
                      <div className="flex flex-wrap gap-2">
                        {years.map((y) => (
                          <button
                            key={y}
                            onClick={() => onSelectYear(y)}
                            className="px-4 py-2 rounded-lg border border-border/40 text-sm font-medium transition-all bg-card/50 hover:bg-card hover:border-primary/50 hover:shadow-sm"
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 3 */}
                <div className={[base, step === 3 ? active : hiddenRight].join(" ")}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                    <div className="font-semibold text-lg flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      {t("stepExams")}
                    </div>

                    <div className="w-full sm:max-w-xs relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                      <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t("searchExamPlaceholder")}
                        className="pl-9 rounded-lg bg-card/50 border-border/40"
                      />
                    </div>
                  </div>

                  {examsLoading ? (
                    <div className="text-sm text-muted-foreground flex items-center gap-2 py-8">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      {t("loading")}
                    </div>
                  ) : filteredExams.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">{t("noExams")}</div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredExams.map((exam: any) => {
                        const showAIBadge = exam.type === "WRITING"
                        const isTest = exam.type === "TEST"
                        const isStarting = startingId === String(exam.bankId || exam.id)

                        return (
                          <div
                            key={exam.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-card/50 hover:bg-card/80 transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm">{exam.title || exam.name}</div>

                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                {showAIBadge ? (
                                  <Image src="/ai.png" alt="AI" width={18} height={18} />
                                ) : isTest ? (
                                  <Image src="/test.png" alt="Test" width={18} height={18} />
                                ) : (
                                  <BookOpen className="h-4 w-4 text-primary/70" />
                                )}
                                <span>
                                  {t("exam.card.questions_preview", {
                                    count: exam.questionCount ?? 0,
                                    total: approxCount((exam as any).questionsTotal),
                                  })}
                                </span>
                              </div>

                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span>{t("examDuration")}:</span>
                                <span>
                                  {exam.durationMinutes ?? "-"} {t("minutes")}
                                </span>
                              </div>

                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span>{t("examtype")}:</span>
                                <span>
                                  {exam.type === "TEST"
                                    ? t("examTypeTest")
                                    : exam.type === "WRITING" || exam.type === "WRITTING"
                                      ? t("examTypeWritting")
                                      : "-"}
                                </span>
                              </div>
                            </div>

                            <div className="grid sm:flex items-center gap-3 ml-4">
                              <div className="text-right">
                                <div className="font-semibold text-sm">
                                  {Number((exam as any)?.price) === 0 ? (
                                    <span className="text-green-600">{t("free")}</span>
                                  ) : (
                                    <>{fromCents(toCents((exam as any)?.price || 0))} AZN</>
                                  )}
                                </div>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => startExam(exam)}
                                disabled={isStarting}
                                className="rounded-lg h-8 px-3 group-hover:shadow-md transition-all"
                              >
                                {isStarting ? t("creatingToken") || "..." : t("start")}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
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