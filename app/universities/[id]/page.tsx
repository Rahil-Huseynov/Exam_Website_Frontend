"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PublicNavbar } from "@/components/public-navbar"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"
import { api, University, Exam } from "@/lib/api"
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Calendar,
  ArrowRight,
  GraduationCap,
  Layers,
} from "lucide-react"

export default function UniversityExamsPage() {
  const params = useParams()
  const router = useRouter()
  const uniId = params.id as string

  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const { user } = useAuth()

  const [university, setUniversity] = useState<University | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  const getName = (item: {
    name: string
    nameAz?: string
    nameEn?: string
    nameRu?: string
  }) => {
    if (locale === "az" && item.nameAz) return item.nameAz
    if (locale === "ru" && item.nameRu) return item.nameRu
    if (locale === "en" && item.nameEn) return item.nameEn
    return item.name
  }

  useEffect(() => {
    if (!uniId) return

    const load = async () => {
      try {
        setLoading(true)
        const unis = await api.getUniversities()
        const found = unis.find((u) => u.id === uniId) || null
        setUniversity(found)

        const examList = await api.getExamsByFilter(uniId)
        setExams(examList || [])
      } catch (err) {
        console.error("University exams load error:", err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [uniId])

  const getLogoUrl = (logo?: string | null) => {
    if (!logo) return null
    if (logo.startsWith("http")) return logo
    const base =
      process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE ||
      process.env.NEXT_PUBLIC_API_URL ||
      ""
    return `${base.replace(/\/$/, "")}/${logo.replace(/^\//, "")}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {user ? <Navbar /> : <PublicNavbar />}

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/5" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="container relative mx-auto px-4 pt-8 pb-12 md:pt-10 md:pb-16">
            <Button
              variant="ghost"
              size="sm"
              className="mb-8 gap-2 text-muted-foreground hover:text-foreground rounded-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === "az" ? "Geri" : locale === "ru" ? "Назад" : "Back"}
            </Button>

            {loading ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-28 h-28 rounded-3xl bg-muted animate-pulse shrink-0" />
                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div className="h-9 w-64 bg-muted animate-pulse rounded-xl mx-auto sm:mx-0" />
                  <div className="h-5 w-32 bg-muted animate-pulse rounded-lg mx-auto sm:mx-0" />
                </div>
              </div>
            ) : university ? (
              <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
                <div className="relative shrink-0">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-card border border-border/60 shadow-xl shadow-primary/5 flex items-center justify-center overflow-hidden">
                    {getLogoUrl(university.logo) ? (
                      <img
                        src={getLogoUrl(university.logo)!}
                        alt={getName(university)}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <span className="text-4xl font-black text-primary">
                        {getName(university).charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
                  </div>
                </div>

                <div className="text-center sm:text-left space-y-2">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
                    {getName(university)}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      <Layers className="h-3.5 w-3.5" />
                      {exams.length}{" "}
                      {locale === "az"
                        ? "imtahan"
                        : locale === "ru"
                          ? "экзамен"
                          : "exams"}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-3xl bg-muted/60 animate-pulse"
                />
              ))}
            </div>
          ) : !university ? (
            <div className="text-center py-24 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-muted flex items-center justify-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold">
                {locale === "az"
                  ? "Universitet tapılmadı"
                  : locale === "ru"
                    ? "Университет не найден"
                    : "University not found"}
              </h2>
              <Button asChild className="rounded-full">
                <Link href="/">
                  {locale === "az"
                    ? "Ana səhifəyə qayıt"
                    : locale === "ru"
                      ? "Вернуться на главную"
                      : "Back to home"}
                </Link>
              </Button>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-muted/50 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                {locale === "az"
                  ? "Bu universitet üçün hələ imtahan yoxdur."
                  : locale === "ru"
                    ? "Для этого университета пока нет экзаменов."
                    : "No exams available for this university yet."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {exams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/exams/${exam.id}`}
                  className="group block"
                >
                  <Card className="h-full p-6 rounded-3xl border border-border/60 bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {exam.title}
                        </h3>
                        <span
                          className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                            exam.type === "TEST"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary/10 text-secondary"
                          }`}
                        >
                          {exam.type}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                          <span className="truncate">{getName(exam.subject)}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                          <span>{exam.year}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                          <span>
                            {exam.durationMinutes}{" "}
                            {locale === "az"
                              ? "dəqiqə"
                              : locale === "ru"
                                ? "минут"
                                : "min"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-xl font-extrabold text-primary">
                          {exam.price} ₼
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                          {locale === "az"
                            ? "Bax"
                            : locale === "ru"
                              ? "Смотреть"
                              : "View"}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}