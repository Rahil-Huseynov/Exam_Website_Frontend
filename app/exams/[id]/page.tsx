"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { api, type Exam } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PublicNavbar } from "@/components/public-navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Clock,
  GraduationCap,
  Layers,
  Sparkles,
  ArrowLeft,
  FileText,
  HelpCircle,
  Coins,
  Share2,
  Link2,
  Check,
} from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
// @ts-expect-error CSS side-effect import
import "react-toastify/dist/ReactToastify.css"
import Image from "next/image"
import {
  deleteCookie_EXAM_DURATION_COOKIE,
  EXAM_DURATION_COOKIE,
  setCookie_EXAM_DURATION_COOKIE,
} from "@/helper/ExamDurationMinutesHelper"

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

export default function ExamDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string

  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!examId) return

    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)
        setError("")
        const data = await api.getExamById(examId)
        if (cancelled) return
        if (!data) {
          setError(t("examNotFound"))
          return
        }
        setExam(data)
      } catch (err: any) {
        const msg = err?.message || t("errLoadExams")
        if (!cancelled) {
          setError(msg)
          toast.error(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [examId])

  useEffect(() => {
    if (exam?.title) {
      document.title = `${exam.title} | ${t("examsTitle")}`
    } else if (loading) {
      document.title = t("loading")
    } else {
      document.title = t("examNotFound")
    }

    return () => {
      document.title = t("examsTitle") 
    }
  }, [exam?.title, loading, t])

  async function startExam() {
    if (!exam) return

    try {
      if (!user?.id) {
        toast.error(t("errLoginRequired"))
        router.push("/login")
        return
      }

      setStarting(true)

      const bankId = String((exam as any).bankId ?? exam.id ?? "")
      if (!bankId) {
        toast.error(t("errBankNotFound"))
        return
      }

      deleteCookie_EXAM_DURATION_COOKIE(EXAM_DURATION_COOKIE)

      const duration = (exam as any).durationMinutes
      if (duration !== undefined && duration !== null && !Number.isNaN(Number(duration))) {
        setCookie_EXAM_DURATION_COOKIE(EXAM_DURATION_COOKIE, String(duration), Number(EXAM_DURATION_COOKIE))
      }

      const tok = await api.createExamToken(bankId, user.id)
      const token = String((tok as any)?.token || "")
      const attemptId = String((tok as any)?.attemptId || "")

      if (!token || !attemptId) {
        toast.error(t("errTokenNotCreated"))
        return
      }

      setTokenBank(token, bankId)
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`exam_attempt_${token}`, attemptId)
      }

      router.push(`/exam-token/${token}`)
    } catch (e: any) {
      toast.error(e?.message || t("errStartExam"))
    } finally {
      setStarting(false)
    }
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const shareText = exam
    ? `${exam.title} — ${t("shareExamText")}`
    : t("shareExamText")

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=480")
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success(t("linkCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("linkCopyFailed"))
    }
  }

  const examType = String(exam?.type || "")
  const isWriting = examType === "WRITING" || examType === "WRITTING"
  const isTest = examType === "TEST"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/40 dark:from-gray-950 dark:via-gray-950 dark:to-violet-950/20 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}
      <ToastContainer position="top-right" autoClose={2200} newestOnTop closeOnClick pauseOnHover theme="colored" />

      <main className="container mx-auto px-4 py-8 flex-1 max-w-5xl">
        {/* Back */}
        <button
          onClick={() => router.push("/exams")}
          className="cursor-pointer group mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {t("backToExams")}
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-4 border-violet-100 dark:border-violet-900" />
              <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        ) : error || !exam ? (
          <div className="text-center py-24">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/40">
              <BookOpen className="h-10 w-10 text-violet-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("examNotFound")}</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {error || t("examNotFoundDesc")}
            </p>
            <Button
              onClick={() => router.push("/exams")}
              className="bg-violet-600 hover:bg-violet-700 cursor-pointer"
            >
              {t("backToExams")}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-xl shadow-violet-500/5">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-violet-400/20 to-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-gradient-to-tr from-blue-400/15 to-fuchsia-400/15 blur-3xl" />

              <div className="relative p-6 sm:p-8 md:p-10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white border-0 px-3 py-1 text-xs font-medium shadow-sm">
                        {exam.year}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-0 px-3 py-1 text-xs"
                      >
                        {isTest
                          ? t("examTypeTest")
                          : isWriting
                            ? t("examTypeWritting")
                            : examType || "-"}
                      </Badge>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance leading-tight">
                      {exam.title}
                    </h1>

                    <div className="flex flex-col gap-2 text-sm sm:text-base">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <span>{tUniName(exam.university, locale)}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-violet-600 dark:text-violet-400 font-medium">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                          <Layers className="h-4 w-4" />
                        </div>
                        <span>{tSubjName(exam.subject, locale)}</span>
                      </div>
                    </div>
                  </div>

                  {(isWriting || isTest) && (
                    <div className="shrink-0 self-start">
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-violet-500/10 border border-violet-100 dark:border-violet-900/50">
                        <Image
                          src={isWriting ? "/ai.png" : "/test.png"}
                          alt={isWriting ? "AI" : "Test"}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="group relative overflow-hidden rounded-2xl border border-emerald-100/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/30 p-4 sm:p-5 transition-all hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("examTotalQuestions")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {approxCount((exam as any)._count?.questions ?? (exam as any).questionsTotal)}
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-violet-100/80 dark:border-violet-900/40 bg-gradient-to-br from-violet-50 to-indigo-50/80 dark:from-violet-950/40 dark:to-indigo-950/30 p-4 sm:p-5 transition-all hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("examGivenQuestions")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400 tracking-tight">
                  {(exam as any).questionCount ?? "-"}
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-fuchsia-100/80 dark:border-fuchsia-900/40 bg-gradient-to-br from-fuchsia-50 to-purple-50/80 dark:from-fuchsia-950/40 dark:to-purple-950/30 p-4 sm:p-5 transition-all hover:shadow-lg hover:shadow-fuchsia-500/10 hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("examDuration")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-fuchsia-600 dark:text-fuchsia-400 tracking-tight">
                  {exam.durationMinutes ?? "-"}
                  <span className="text-sm font-medium ml-1 opacity-70">{t("minutes")}</span>
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-blue-100/80 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 to-cyan-50/80 dark:from-blue-950/40 dark:to-cyan-950/30 p-4 sm:p-5 transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("priceLabel")}</p>
                {Number(exam.price) === 0 ? (
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {t("free")}
                  </p>
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                    {Number(exam.price).toFixed(2)}
                    <span className="text-sm font-medium ml-1 opacity-70">AZN</span>
                  </p>
                )}
              </div>
            </div>

            {/* Share section */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{t("shareExam")}</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() =>
                    openShare(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
                    )
                  }
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm font-medium transition-all hover:border-[#1877F2] hover:bg-[#1877F2]/5 hover:text-[#1877F2] hover:shadow-sm"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>

                <button
                  onClick={() =>
                    openShare(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
                    )
                  }
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm font-medium transition-all hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/10 hover:shadow-sm"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter
                </button>

                <button
                  onClick={() =>
                    openShare(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
                    )
                  }
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm font-medium transition-all hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#0A66C2] hover:shadow-sm"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </button>

                <button
                  onClick={() =>
                    openShare(
                      `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`
                    )
                  }
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm font-medium transition-all hover:border-[#25D366] hover:bg-[#25D366]/5 hover:text-[#25D366] hover:shadow-sm"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </button>

                <button
                  onClick={copyLink}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm font-medium transition-all hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 hover:shadow-sm"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {copied ? t("copied") : t("copyLink")}
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="sticky bottom-4 z-10 sm:static">
              <div className="rounded-2xl border border-violet-200/60 dark:border-violet-800/40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-4 sm:p-5 shadow-xl shadow-violet-500/10">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="h-12 flex-1 rounded-xl text-base font-semibold bg-gradient-to-r from-violet-600 via-violet-600 to-blue-600 hover:from-violet-700 hover:via-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5 cursor-pointer"
                    disabled={starting}
                    onClick={() => void startExam()}
                  >
                    {starting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        {t("creatingToken")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {t("startExam")}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}