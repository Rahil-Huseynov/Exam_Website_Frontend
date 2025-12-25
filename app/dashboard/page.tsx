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
  FileText,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  CalendarDays,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

import { toastError } from "@/lib/toast"

type Attempt = any
type Step = 1 | 2 | 3

function getDisplayName(user: any) {
  if (!user) return "İstifadəçi"
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return full || user.name || user.email || "İstifadəçi"
}

function tName(obj: any, locale: string) {
  if (!obj) return ""
  if (locale === "az") return obj.nameAz || obj.name
  if (locale === "ru") return obj.nameRu || obj.name
  return obj.nameEn || obj.name
}

/** ==========================
 * ✅ One-time EXAM URL helper
 * token -> bankId map (sessionStorage)
 * ========================== */
function tokenBankKey(token: string) {
  return `exam_token_bank_${token}`
}

function setTokenBank(token: string, bankId: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(tokenBankKey(token), bankId)
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const lastErrorRef = useRef<string>("")

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const profile = user ?? (await refreshUser())
      if (!profile) {
        router.replace("/login")
        return
      }

      const data = await api.getUserAttempts(profile.id)
      setAttempts(Array.isArray((data as any)?.attempts) ? (data as any).attempts : [])

      lastErrorRef.current = ""
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Məlumatlar yüklənmədi"
      if (lastErrorRef.current !== msg) {
        lastErrorRef.current = msg
        toastError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [user, refreshUser, router])

  useEffect(() => {
    if (!authLoading) loadData()
  }, [authLoading, loadData])

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
    ;(async () => {
      try {
        setUniLoading(true)
        const list = await api.getUniversities()
        setUniversities(Array.isArray(list) ? list : [])
      } catch (e: any) {
        toastError(e?.message || "Universitet siyahısı yüklənmədi")
      } finally {
        setUniLoading(false)
      }
    })()
  }, [])

  const onSelectUniversity = useCallback(async (u: University) => {
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
      toastError(e?.message || "İllər yüklənmədi")
    } finally {
      setYearsLoading(false)
    }
  }, [])

  const onSelectYear = useCallback(
    async (y: number) => {
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
        toastError(e?.message || "İmtahanlar yüklənmədi")
      } finally {
        setExamsLoading(false)
      }
    },
    [selectedUni],
  )

  const filteredExams = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return exams
    return exams.filter((e: any) => {
      const title = String(e?.title || "").toLowerCase()
      const subj = String(e?.subject?.name || "").toLowerCase()
      return title.includes(s) || subj.includes(s)
    })
  }, [exams, q])

  const displayName = getDisplayName(user)
  const balance = typeof (user as any)?.balance === "number" ? (user as any).balance : 0

  const completedAttempts = attempts.filter((a) => a?.completedAt || a?.finishedAt || a?.status === "FINISHED")
  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => {
          const score = Number(a?.score || 0)
          const total = Number(a?.totalQuestions || a?.total || 1)
          return sum + (score / (total || 1)) * 100
        }, 0) / completedAttempts.length
      : 0

  const totalSpent = useMemo(() => attempts.reduce((sum, a) => sum + Number(a?.exam?.price || a?.price || 0), 0), [attempts])

  async function startExam(exam: Exam) {
    try {
      if (!user?.id) {
        toastError("Login olunmayıb. İmtahana başlamaq üçün giriş edin.")
        return
      }

      const bankId = String((exam as any).bankId ?? (exam as any).id)
      if (!bankId) {
        toastError("bankId tapılmadı.")
        return
      }

      const tok = await api.createExamToken(bankId, user.id) 
      const token = String((tok as any)?.token || "")
      const url = String((tok as any)?.url || `/exam-token/${token}`)

      if (!token) {
        toastError("Token yaradılmadı.")
        return
      }

      setTokenBank(token, bankId)

      router.push(url)
    } catch (e: any) {
      toastError(e?.message || "İmtahana başlamaq mümkün olmadı")
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
      <div className="min-h-screen gradient-bg flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
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
      <div className="min-h-screen gradient-bg flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Hesab yoxlanılır...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Panel
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("welcome")}
              </span>
              , {displayName}!
            </h1>

            <p className="text-muted-foreground">Buradan imtahan seç, nəticələrini izləy və balansını idarə et.</p>
          </div>

          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Balans</CardTitle>
                <Wallet className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Number(balance).toFixed(2)} AZN</div>
                <Button asChild variant="link" className="px-0 h-auto mt-3">
                  <Link href="/balance" className="flex items-center gap-1">
                    Balansı artır
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Tamamlanan imtahanlar</CardTitle>
                <BookOpen className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedAttempts.length}</div>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Orta nəticə</CardTitle>
                <TrendingUp className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Number(averageScore).toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Ümumi xərclənən</CardTitle>
                <FileText className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Number(totalSpent).toFixed(2)} AZN</div>
              </CardContent>
            </Card>
          </div>

          {/* Exam Wizard */}
          <Card className="border-2 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    İmtahanı seç və başla
                  </CardTitle>
                  <CardDescription>
                    2 addımda bitir: əvvəl universiteti seç, sonra ili seç — sistem uyğun imtahanları göstərəcək.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    Addım {step}/3
                  </Badge>

                  {step > 1 && (
                    <Button variant="outline" className="rounded-2xl" onClick={goBack}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Geri
                    </Button>
                  )}
                </div>
              </div>

              {/* progress pills */}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full border flex items-center gap-1">
                  <CheckCircle2 className={`h-4 w-4 ${step >= 1 ? "opacity-100" : "opacity-30"}`} />
                  Universitet
                </span>
                <span className="px-3 py-1 rounded-full border flex items-center gap-1">
                  <CheckCircle2 className={`h-4 w-4 ${step >= 2 ? "opacity-100" : "opacity-30"}`} />
                  İl
                </span>
                <span className="px-3 py-1 rounded-full border flex items-center gap-1">
                  <CheckCircle2 className={`h-4 w-4 ${step >= 3 ? "opacity-100" : "opacity-30"}`} />
                  İmtahanlar
                </span>

                {selectedUni && (
                  <span className="px-3 py-1 rounded-full border text-muted-foreground">
                    Seçilən universitet: <span className="font-medium">{tName(selectedUni, locale)}</span>
                  </span>
                )}
                {selectedYear && (
                  <span className="px-3 py-1 rounded-full border text-muted-foreground">
                    Seçilən il: <span className="font-medium">{selectedYear}</span>
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="relative min-h-[320px]">
              {/* STEP 1: Universities */}
              <div className={[base, step === 1 ? active : hiddenLeft].join(" ")}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="font-medium">Universitet seç</div>

                  {uniLoading && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Yüklənir...
                    </div>
                  )}
                </div>

                {universities.length === 0 && !uniLoading ? (
                  <div className="text-sm text-muted-foreground">
                    Hazırda universitet tapılmadı. Bir az sonra yenidən yoxla.
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {universities.map((u) => {
                      const name = tName(u, locale)

                      return (
                        <button
                          key={u.id}
                          onClick={() => onSelectUniversity(u)}
                          className={[
                            "group aspect-square rounded-3xl border-2 p-4 text-left bg-card",
                            "hover:shadow-lg hover:-translate-y-0.5 transition-all",
                            "flex flex-col justify-between",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold leading-snug line-clamp-2">{name}</div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{u.name}</div>
                            </div>

                            {u.logo ? (
                              <img
                                src={u.logo}
                                alt={name}
                                className="h-11 w-11 rounded-2xl object-cover border group-hover:scale-[1.02] transition-transform"
                              />
                            ) : (
                              <div className="h-11 w-11 rounded-2xl border flex items-center justify-center text-xs text-muted-foreground">
                                —
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Davam et</span>
                            <ArrowRight className="h-4 w-4 opacity-60 group-hover:opacity-90 transition-opacity" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* STEP 2: Years */}
              <div className={[base, step === 2 ? active : step < 2 ? hiddenRight : hiddenLeft].join(" ")}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="font-medium flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    İl seç
                  </div>
                </div>

                {yearsLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    Seçilən universitet üçün illər yüklənir...
                  </div>
                ) : years.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Bu universitet üçün imtahan ili tapılmadı.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      İmtahan ili seçdikdən sonra uyğun imtahanlar siyahısı açılacaq.
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {years.map((y) => (
                        <button
                          key={y}
                          onClick={() => onSelectYear(y)}
                          className={[
                            "px-4 py-2 rounded-2xl border text-sm transition-all",
                            "hover:bg-muted hover:-translate-y-0.5",
                          ].join(" ")}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: Exams */}
              <div className={[base, step === 3 ? active : hiddenRight].join(" ")}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Uygun imtahanlar
                  </div>

                  <div className="w-full sm:max-w-xs relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Axtar: imtahan adı / fənn..."
                      className="pl-9 rounded-2xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <Badge className="rounded-full">
                    {selectedUni ? tName(selectedUni, locale) : "—"} • {selectedYear ?? "—"}
                  </Badge>

                  <span className="text-xs text-muted-foreground">
                    Tapılan: <span className="font-medium">{filteredExams.length}</span>
                  </span>
                </div>

                {examsLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    İmtahanlar yüklənir...
                  </div>
                ) : filteredExams.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Bu seçimə uyğun imtahan tapılmadı. Başqa il seçə bilərsən.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredExams.map((e: any) => (
                      <Card key={e.id} className="rounded-3xl border-2 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <CardTitle className="text-base truncate">{e.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {e.subject?.name || "Fənn göstərilməyib"} • {e.year || "—"}
                              </CardDescription>
                            </div>
                            <Badge className="rounded-full">{Number(e.price || 0).toFixed(2)} AZN</Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="flex items-center justify-end">
                          <Button className="rounded-2xl" onClick={() => startExam(e)}>
                            İmtahana başla
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
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
