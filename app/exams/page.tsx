"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { api, type Exam, type University, type Subject } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Filter, Sparkles } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { PublicNavbar } from "@/components/public-navbar"

function tokenBankKey(token: string) {
  return `exam_token_bank_${token}`
}
function setTokenBank(token: string, bankId: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(tokenBankKey(token), bankId)
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint])

  return isMobile
}


function approxCount(value?: number) {
  if (value === undefined || value === null || value <= 0) return "-"

  const rounded = Math.floor(value / 10) * 10
  return `${rounded}+`
}

function tUniName(u: any, locale: string) {
  if (!u) return ""
  if (locale === "az") return u.nameAz || u.name
  if (locale === "ru") return u.nameRu || u.name
  return u.nameEn || u.name
}
function tSubjName(s: any, locale: string) {
  if (!s) return ""
  if (locale === "az") return s.nameAz || s.name
  if (locale === "ru") return s.nameRu || s.name
  return s.nameEn || s.name
}

export default function ExamsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const isMobile = useIsMobile()

  const [exams, setExams] = useState<Exam[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [years, setYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const [startingId, setStartingId] = useState<string>("")

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

      ; (async () => {
        try {
          setLoading(true)
          setError("")
          const [universitiesData, subjectsData] = await Promise.all([
            api.getUniversities(),
            api.getSubjects(),
          ])
          if (cancelled) return
          setUniversities(Array.isArray(universitiesData) ? universitiesData : [])
          setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
        } catch (err: any) {
          const msg = err?.message || t("errLoadExams")
          if (cancelled) return
          setError(msg)
          toast.error(msg)
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    ; (async () => {
      try {
        const uniId = selectedUniversity !== "all" ? selectedUniversity : undefined
        const subId = selectedSubject !== "all" ? selectedSubject : undefined

        const yearsData = await api.getExamYears({ universityId: uniId, subjectId: subId })
        setYears(Array.isArray(yearsData) ? [...yearsData].sort((a, b) => b - a) : [])
      } catch (err: any) {
        toast.error(err?.message || t("errLoadYears"))
        setYears([])
      }
    })()
  }, [selectedUniversity, selectedSubject])

  const loadExams = async (p: number) => {
    setLoadingMore(true)
    try {
      const params: any = {
        page: p,
        limit: 10,
      }
      if (selectedUniversity !== "all") params.universityId = selectedUniversity
      if (selectedSubject !== "all") params.subjectId = selectedSubject
      if (selectedYear !== "all") params.year = Number(selectedYear)
      if (searchTerm) params.search = searchTerm

      const newExams = await api.getExams(params)
      setExams((prev) => (p === 1 ? newExams : [...prev, ...newExams]))
      setHasMore(newExams.length === 10)
    } catch (err: any) {
      setError(err?.message || t("errLoadExams"))
      toast.error(err?.message || t("errLoadExams"))
    } finally {
      setLoadingMore(false)
      if (p === 1) setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    setExams([])
    setPage(1)
    setHasMore(true)
    setIsInitialLoading(true)
    loadExams(1)
  }, [searchTerm, selectedUniversity, selectedSubject, selectedYear])

  useEffect(() => {
    if (page > 1 && hasMore && !loadingMore) {
      loadExams(page)
    }
  }, [page])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 1.0 },
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
    }
  }, [hasMore, loadingMore])

  async function startExam(exam: Exam) {
    try {
      if (!user?.id) {
        toast.error(t("errLoginRequired"))
        router.push("/login")
        return
      }

      setStartingId(String(exam.id))

      const bankId = String((exam as any).bankId ?? exam.id ?? "")
      if (!bankId) {
        toast.error(t("errBankNotFound"))
        return
      }

      const tok = await api.createExamToken(bankId, user.id)
      const token = String((tok as any)?.token || "")

      if (!token) {
        toast.error(t("errTokenNotCreated"))
        return
      }

      setTokenBank(token, bankId)
      router.push(`/exam-token/${token}`)
    } catch (e: any) {
      toast.error(e?.message || t("errStartExam"))
    } finally {
      setStartingId("")
    }
  }
  const truncateText = (text: string) => {
    const limit = isMobile ? 10 : 40
    return text.length > limit ? text.slice(0, limit) + "..." : text
  }

  const selectedUniversityLabel = useMemo(() => {
    if (selectedUniversity === "all") return t("filterUniversity")
    const uni = universities.find(u => String(u.id) === selectedUniversity)
    return uni ? truncateText(tUniName(uni, locale)) : t("filterUniversity")
  }, [selectedUniversity, universities, locale])

  const selectedUniversityFull = useMemo(() => {
    if (selectedUniversity === "all") return t("filterUniversity")
    const uni = universities.find(u => String(u.id) === selectedUniversity)
    return uni ? tUniName(uni, locale) : t("filterUniversity")
  }, [selectedUniversity, universities, locale])

  const selectedSubjectLabel = useMemo(() => {
    if (selectedSubject === "all") return t("filterSubject")
    const subj = subjects.find(s => String(s.id) === selectedSubject)
    return subj ? truncateText(tSubjName(subj, locale)) : t("filterSubject")
  }, [selectedSubject, subjects, locale])

  const selectedSubjectFull = useMemo(() => {
    if (selectedSubject === "all") return t("filterSubject")
    const subj = subjects.find(s => String(s.id) === selectedSubject)
    return subj ? tSubjName(subj, locale) : t("filterSubject")
  }, [selectedSubject, subjects, locale])

  const selectedYearLabel = useMemo(() => {
    if (selectedYear === "all") return t("filterYear")
    return truncateText(String(selectedYear))
  }, [selectedYear])

  const selectedYearFull = useMemo(() => {
    if (selectedYear === "all") return t("filterYear")
    return String(selectedYear)
  }, [selectedYear])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}
      <ToastContainer position="top-right" autoClose={2200} newestOnTop closeOnClick pauseOnHover theme="colored" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t("examsTitle")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">{t("examsSubtitle")}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="lg:col-span-5 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full sm:flex sm:justify-between sm:items-center">

            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <span title={selectedUniversityFull} className="block truncate max-w-[240px]">
                  {selectedUniversityLabel}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">{t("filterAll")}</SelectItem>
                {universities.map((uni) => {
                  const full = tUniName(uni, locale)
                  return (
                    <SelectItem key={uni.id} value={String(uni.id)}>
                      <span title={full} className="block truncate max-w-[400px]">
                        {truncateText(full)}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>


            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <span title={selectedSubjectFull} className="block truncate max-w-[240px]">
                  {selectedSubjectLabel}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">{t("filterAll")}</SelectItem>
                {subjects.map((subj) => {
                  const full = tSubjName(subj, locale)
                  return (
                    <SelectItem key={subj.id} value={String(subj.id)}>
                      <span title={full} className="block truncate max-w-[400px]">
                        {truncateText(full)}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>


            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2 shrink-0" />
                <span title={selectedYearFull} className="block truncate max-w-[240px]">
                  {selectedYearLabel}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">{t("filterAll")}</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>


          </div>

          {loading || isInitialLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-900 border-t-violet-600" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-violet-400 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t("noExamsFound")}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {exams.map((exam) => {
                const isStarting = startingId === String(exam.id)
                return (
                  <Card
                    key={exam.id}
                    className="flex flex-col backdrop-blur-sm bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs font-medium">
                          {exam.year}
                        </span>
                      </div>
                      <CardTitle className="text-balance">{exam.title}</CardTitle>
                      <CardDescription className="space-y-1">
                        <div>{tUniName(exam.university, locale)}</div>
                        <div className="font-medium text-violet-600">{tSubjName(exam.subject, locale)}</div>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm p-3 rounded-lg 
  bg-gradient-to-r from-emerald-50 to-teal-50 
  dark:from-emerald-950/20 dark:to-teal-950/20">
                          <span className="text-muted-foreground">{t("examTotalQuestions")}:</span>
                          <span className="font-bold text-emerald-600">
                            {approxCount((exam as any).questionsTotal)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm p-3 rounded-lg 
  bg-gradient-to-r from-violet-50 to-indigo-50 
  dark:from-violet-950/20 dark:to-indigo-950/20">
                          <span className="text-muted-foreground">{t("examGivenQuestions")}:</span>
                          <span className="font-bold text-violet-600">{(exam as any).questionCount ?? "-"}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                          <span className="text-muted-foreground">{t("priceLabel")}:</span>
                          <span className="font-bold text-blue-600">{Number(exam.price).toFixed(2)} AZN</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                        disabled={isStarting}
                        onClick={() => void startExam(exam)}
                      >
                        {isStarting ? t("creatingToken") : t("startExam")}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
          {loadingMore && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-900 border-t-violet-600" />
            </div>
          )}
          <div ref={loaderRef} className="h-1" />
        </div>
      </main>

      <Footer />
    </div>
  )
}