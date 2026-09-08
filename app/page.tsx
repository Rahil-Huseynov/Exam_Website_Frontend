"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"
import {
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { api, University } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const { user } = useAuth()
  const router = useRouter()

  const [universities, setUniversities] = useState<University[]>([])
  const [loadingUnis, setLoadingUnis] = useState(true)

  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const autoPlayRef = useRef<number | null>(null)
  const isPaused = useRef(false)

  const getUniName = (uni: University) => {
    if (locale === "az" && uni.nameAz) return uni.nameAz
    if (locale === "ru" && uni.nameRu) return uni.nameRu
    if (locale === "en" && uni.nameEn) return uni.nameEn
    return uni.name
  }

  useEffect(() => {
    const fetchUnis = async () => {
      try {
        const data = await api.getUniversities()
        setUniversities(data || [])
      } catch (err) {
        console.error("Universities fetch error:", err)
      } finally {
        setLoadingUnis(false)
      }
    }
    fetchUnis()
  }, [])

  useEffect(() => {
    if (!user) return;

    if (sessionStorage.getItem("redirected")) return;

    sessionStorage.setItem("redirected", "true");

    if (user.role === "client") {
      router.replace("/dashboard");
    } else if (user.role === "admin" || user.role === "superadmin") {
      router.replace("/admin");
    }
  }, [user, router]);


  // Autoplay
  useEffect(() => {
    if (!trackRef.current || universities.length === 0) return

    const el = trackRef.current

    const animate = () => {
      if (!isPaused.current && !isDragging.current) {
        el.scrollLeft += 0.6
        // Sonsuz döngü
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0
        }
      }
      autoPlayRef.current = requestAnimationFrame(animate)
    }

    autoPlayRef.current = requestAnimationFrame(animate)

    return () => {
      if (autoPlayRef.current) cancelAnimationFrame(autoPlayRef.current)
    }
  }, [universities])

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return
    isDragging.current = true
    isPaused.current = true
    startX.current = e.pageX - trackRef.current.offsetLeft
    scrollLeft.current = trackRef.current.scrollLeft
    trackRef.current.style.cursor = "grabbing"
  }

  const onMouseLeave = () => {
    isDragging.current = false
    isPaused.current = false
    if (trackRef.current) trackRef.current.style.cursor = "grab"
  }

  const onMouseUp = () => {
    isDragging.current = false
    isPaused.current = false
    if (trackRef.current) trackRef.current.style.cursor = "grab"
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !trackRef.current) return
    e.preventDefault()
    const x = e.pageX - trackRef.current.offsetLeft
    const walk = (x - startX.current) * 1.4
    trackRef.current.scrollLeft = scrollLeft.current - walk
  }

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => {
    if (!trackRef.current) return
    isDragging.current = true
    isPaused.current = true
    startX.current = e.touches[0].pageX - trackRef.current.offsetLeft
    scrollLeft.current = trackRef.current.scrollLeft
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !trackRef.current) return
    const x = e.touches[0].pageX - trackRef.current.offsetLeft
    const walk = (x - startX.current) * 1.4
    trackRef.current.scrollLeft = scrollLeft.current - walk
  }

  const onTouchEnd = () => {
    isDragging.current = false
    isPaused.current = false
  }

  // Prev / Next buttons
  const scrollByAmount = (dir: "left" | "right") => {
    if (!trackRef.current) return
    const amount = 220
    trackRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

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
    <div className="min-h-screen flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}

      <section className="relative overflow-hidden gradient-bg">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("homeBadge")}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                {t("homeHeroTitle1")}
              </span>
              <br />
              <span className="text-foreground">{t("homeHeroTitle2")}</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
              {t("homeHeroDesc")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              >
                <Link href="/register">{t("homeCtaStart")}</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg bg-transparent"
              >
                <Link href="/login">{t("homeCtaLogin")}</Link>
              </Button>
            </div>

          </div>
          <div className="pt-20">
            {loadingUnis ? (
              <div className="flex justify-center gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-40 h-48 rounded-3xl bg-muted/60 animate-pulse"
                  />
                ))}
              </div>
            ) : universities.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {locale === "az"
                  ? "Universitet tapılmadı"
                  : locale === "ru"
                    ? "Университеты не найдены"
                    : "No universities found"}
              </p>
            ) : (
              <div className="relative group/carousel">
                <button
                  onClick={() => scrollByAmount("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 -translate-x-2 hover:scale-110"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  onClick={() => scrollByAmount("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 translate-x-2 hover:scale-110"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

                <div
                  ref={trackRef}
                  className="flex gap-5 overflow-x-auto scrollbar-hide py-4 cursor-grab select-none"
                  style={{
                    scrollBehavior: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                  onMouseDown={onMouseDown}
                  onMouseLeave={onMouseLeave}
                  onMouseUp={onMouseUp}
                  onMouseMove={onMouseMove}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onMouseEnter={() => {
                    isPaused.current = true
                  }}
                >
                  {[...universities, ...universities].map((uni, idx) => (
                    <Link
                      key={`${uni.id}-${idx}`}
                      href={`/universities/${uni.id}`}
                      className="group flex-shrink-0 w-40"
                      draggable={false}
                      onClick={(e) => {
                        // drag zamanı klik işləməsin
                        if (isDragging.current) e.preventDefault()
                      }}
                    >
                      <div className="relative h-48 rounded-3xl border border-border/70 bg-card overflow-hidden transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:-translate-y-2">
                        <div className="h-28 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/10 p-4 relative">
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-primary/10 to-transparent" />
                          {getLogoUrl(uni.logo) ? (
                            <img
                              src={getLogoUrl(uni.logo)!}
                              alt={getUniName(uni)}
                              className="max-h-16 max-w-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 pointer-events-none"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center relative z-10">
                              <span className="text-xl font-bold text-primary">
                                {getUniName(uni).charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 pt-3">
                          <p className="text-sm font-semibold text-center line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {getUniName(uni)}
                          </p>
                        </div>

                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                500+
              </div>
              <div className="text-sm text-muted-foreground">
                {t("homeStatQuestions")}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                50+
              </div>
              <div className="text-sm text-muted-foreground">
                {t("homeStatUniversities")}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                1000+
              </div>
              <div className="text-sm text-muted-foreground">
                {t("homeStatStudents")}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      <section id="features" className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("homeWhyTitle")}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              {t("homeWhyDesc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 space-y-4 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 rounded-3xl bg-gradient-to-br from-card to-primary/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <BookOpen className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">{t("homeFeature1Title")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("homeFeature1Desc")}
              </p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 rounded-3xl bg-gradient-to-br from-card to-secondary/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/25">
                <TrendingUp className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">{t("homeFeature2Title")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("homeFeature2Desc")}
              </p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 rounded-3xl bg-gradient-to-br from-card to-accent/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-success flex items-center justify-center shadow-lg shadow-accent/25">
                <Clock className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">{t("homeFeature3Title")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("homeFeature3Desc")}
              </p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 rounded-3xl bg-gradient-to-br from-card to-primary/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">{t("homeFeature5Title")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("homeFeature5Desc")}
              </p>
            </Card>

            <Card className="p-8 space-y-4 border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 rounded-3xl bg-gradient-to-br from-card to-secondary/5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/25">
                <Shield className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold">{t("homeFeature6Title")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("homeFeature6Desc")}
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px]" />
        <div className="container mx-auto px-4 relative">
          <Card className="max-w-4xl mx-auto p-12 md:p-16 text-center space-y-8 border-2 rounded-3xl bg-gradient-to-br from-card to-primary/5 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              {t("homeReadyTitle")}
            </h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              {t("homeReadyDesc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              >
                <Link href="/register">{t("homeReadyCta")}</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}