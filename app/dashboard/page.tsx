"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

type Attempt = any
type Step = 1 | 2 | 3

function getDisplayName(user: any, locale: string) {
  if (!user) return locale === "ru" ? "Пользователь" : locale === "en" ? "User" : "İstifadəçi"
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return full || user.name || user.email || (locale === "ru" ? "Пользователь" : locale === "en" ? "User" : "İstifadəçi")
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

  const base = "transition-all duration-300 ease-out"
  const active = "opacity-100 translate-x-0"
  const hiddenLeft = "opacity-0 -translate-x-6 pointer-events-none absolute inset-0"
  const hiddenRight = "opacity-0 translate-x-6 pointer-events-none absolute inset-0"

  useEffect(() => {
    let cancelled = false
      ; (async () => {
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
      ; (async () => {
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
  }, [authLoading, user, router])

  async function onSelectUniversity(u: University) {
    setSelectedUni(u)
    setSelectedYear(null)
    setYears([])
    setExams([])
    setQ("")
    setStep(2)

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

  const completedAttempts = attempts.filter((a) => a?.completedAt || a?.finishedAt || a?.status === "FINISHED")
  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => {
        const score = Number(a?.score || 0)
        const total = Number(a?.totalQuestions || a?.total || 1)
        return sum + (score / (total || 1)) * 100
      }, 0) / completedAttempts.length
      : 0

  const totalSpent = useMemo(
    () => attempts.reduce((sum, a) => sum + Number(a?.exam?.price || a?.price || 0), 0),
    [attempts],
  )

  async function startExam(exam: Exam) {
    try {
      if (!user?.id) {
        toastError(t("errNotLoggedIn"))
        return
      }

      const priceCents = toCents((exam as any)?.price || 0)
      const balanceCentsNow = toCents((user as any)?.balance)

      if (balanceCentsNow < priceCents) {
        toastError(t("errNoBalance"))
        return
      }

      const bankId = String((exam as any).bankId ?? (exam as any).id)
      if (!bankId) {
        toastError(t("errBankNotFound"))
        return
      }

      const tok = await api.createExamToken(bankId, user.id)
      const token = String((tok as any)?.token || "")
      const url = String((tok as any)?.url || `/exam-token/${token}`)

      if (!token) {
        toastError(t("errTokenFail"))
        return
      }

      setTokenBank(token, bankId)
      router.push(url)
    } catch (e: any) {
      toastError(e?.message || t("errStartExam"))
    }
  }

  function goBack() {
    if (step === 3) {
      setStep(2)
      setExams([])
      setQ("")
      setSelectedYear(null)
      return
    }
    if (step === 2) {
      setStep(1)
      setSelectedUni(null)
      setSelectedYear(null)
      setYears([])
      setExams([])
      setQ("")
      return
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="space-y-12">
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-xl hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboardBalance")}</CardTitle>
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
                    <Button variant="outline" className="rounded-lg h-9 px-3 bg-transparent" onClick={goBack} size="sm">
                      <ArrowLeft className="h-4 w-4 mr-1.5" />
                      {t("goBack")}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-lg border border-border/40 bg-background/60 flex items-center gap-1.5">
                  <CheckCircle2 className={`h-4 w-4 ${step >= 1 ? "text-primary" : "text-muted-foreground/30"}`} />
                  {t("stepUniversity")}
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
                    {t("selectedUniversity")}:{" "}
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
                  <div className="font-semibold text-lg">{t("chooseUniversity")}</div>

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
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {universities.map((u) => {
                      const name = tName(u, locale)
                      const logoUrl = resolveLogoUrl((u as any)?.logo)

                      return (
                        <button
                          key={u.id}
                          onClick={() => onSelectUniversity(u)}
                          className={[
                            "group aspect-square rounded-lg border border-border/40 p-4 text-left bg-card/50",
                            "hover:border-primary/50 hover:bg-card hover:shadow-md transition-all",
                            "flex flex-col",
                          ].join(" ")}
                        >
                          {/* TOP */}
                          <div className="min-w-0">
                            <div className="font-semibold text-sm leading-snug line-clamp-2">{name}</div>
                          </div>

                          {/* LOGO AREA - fixed height */}
                          <div className="mt-3 flex-1 flex items-center justify-center">
                            <div className="w-full h-80 rounded-md border border-border/40 bg-background/50 overflow-hidden flex items-center justify-center">
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

                          {/* BOTTOM */}
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
                          className={[
                            "px-4 py-2 rounded-lg border border-border/40 text-sm font-medium transition-all",
                            "bg-card/50 hover:bg-card hover:border-primary/50 hover:shadow-sm",
                          ].join(" ")}
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
                    {filteredExams.map((exam: any) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-card/50 hover:bg-card/80 transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{exam.title || exam.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {exam.subject?.name || exam.subject} · {exam.questionCount || 0} {t("questions")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <div className="font-semibold text-sm">
                              {fromCents(toCents((exam as any)?.price || 0))} AZN
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => startExam(exam)}
                            className="rounded-lg h-8 px-3 group-hover:shadow-md transition-all"
                          >
                            {t("start")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
