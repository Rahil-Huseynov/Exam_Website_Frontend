"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "react-toastify"

import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type PublicNewsItem } from "@/lib/api"

import { Navbar } from "@/components/navbar"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  Calendar,
  Image as ImageIcon,
  RefreshCcw,
} from "lucide-react"

const NEXT_PUBLIC_API_URL_FOR_IMAGE =
  process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE || ""

type NewsLanguage = "az" | "en" | "ru"

const toAbsImage = (u: string) => {
  if (!u) return ""

  if (u.startsWith("blob:")) {
    return u
  }

  if (
    u.startsWith("http://") ||
    u.startsWith("https://")
  ) {
    return u
  }

  return `${NEXT_PUBLIC_API_URL_FOR_IMAGE}${
    u.startsWith("/") ? "" : "/"
  }${u}`
}

export default function NewsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [items, setItems] = useState<PublicNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const lang: NewsLanguage = useMemo(() => {
    if (locale === "en") return "en"
    if (locale === "ru") return "ru"
    return "az"
  }, [locale])

  const getNewsUrl = (id: string) => {
    return `/${locale}/news/${encodeURIComponent(id)}`
  }

  const load = useCallback(
    async (requestedPage = 1) => {
      setLoading(true)

      try {
        const res = await api.listNews(
          lang,
          requestedPage,
          12
        )

        setItems(res.items || [])
        setPages(res.meta?.pages || 1)
        setPage(requestedPage)
      } catch (error: any) {
        toast.error(
          error?.message || "Failed to load news"
        )
      } finally {
        setLoading(false)
      }
    },
    [lang]
  )

  useEffect(() => {
    load(1)

    // load is intentionally controlled by lang.
    // Translation function changes should not trigger API requests.
  }, [load])

  const truncate = (
    text: string,
    max = 220
  ) => {
    if (!text) return ""

    if (text.length <= max) {
      return text
    }

    return `${text.slice(0, max).trim()}…`
  }

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString(
        locale === "az"
          ? "az-AZ"
          : locale === "ru"
            ? "ru-RU"
            : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    } catch {
      return date
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("news")}
              </h1>

              <p className="text-muted-foreground mt-2 text-lg">
                {t("newsSubtitle")}
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-2xl cursor-pointer"
              onClick={() => load(page)}
              disabled={loading}
            >
              <RefreshCcw
                className={`h-4 w-4 mr-2 ${
                  loading ? "animate-spin" : ""
                }`}
              />

              {t("newsRefresh")}
            </Button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, index) => (
                <Card
                  key={`news-skeleton-${index}`}
                  className="border-2 rounded-3xl shadow-xl bg-card/50"
                >
                  <CardHeader>
                    <div className="h-5 w-2/3 bg-muted rounded-md animate-pulse" />

                    <div className="h-4 w-40 bg-muted rounded-md animate-pulse mt-2" />
                  </CardHeader>

                  <CardContent>
                    <div className="h-4 w-full bg-muted rounded-md animate-pulse" />

                    <div className="h-4 w-5/6 bg-muted rounded-md animate-pulse mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            /* Empty */
            <Card className="border-2 rounded-3xl shadow-xl bg-card/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                {t("newsEmpty")}
              </CardContent>
            </Card>
          ) : (
            /* News list */
            <div className="grid gap-4">
              {items.map((item) => {
                const newsUrl = getNewsUrl(item.id)

                const publishedDate =
                  item.publishedAt || item.createdAt

                return (
                  <Card
                    key={item.id}
                    className="border-2 rounded-3xl shadow-xl backdrop-blur-sm bg-card/50 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Image */}
                    {item.imageUrl ? (
                      <div className="relative flex items-center justify-center">
                        <img
                          src={toAbsImage(item.imageUrl)}
                          alt={
                            item.title ||
                            t("newsImageAlt")
                          }
                          loading="lazy"
                          className="w-1/2 h-full object-cover p-4 rounded-2xl"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none"
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-full bg-muted/40 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />

                          <span className="text-sm">
                            {t("newsNoImage")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-balance text-xl">
                            <Link
                              href={newsUrl}
                              className="hover:text-primary transition-colors"
                            >
                              {item.title}
                            </Link>
                          </CardTitle>

                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />

                            <time dateTime={publishedDate}>
                              {formatDate(publishedDate)}
                            </time>
                          </CardDescription>
                        </div>

                        <Badge className="bg-gradient-to-r from-primary via-secondary to-accent text-white border-0 shrink-0">
                          {t("newsBadge")}
                        </Badge>
                      </div>
                    </CardHeader>

                    {/* Content */}
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {truncate(item.content, 220)}
                      </p>

                      <Link
                        href={newsUrl}
                        className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
                      >
                        {t("newsReadMore") ||
                          "Ətraflı oxu →"}
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && pages > 1 ? (
            <nav
              className="flex items-center justify-between pt-2"
              aria-label="News pagination"
            >
              <Button
                variant="outline"
                className="rounded-2xl"
                disabled={page <= 1 || loading}
                onClick={() => load(page - 1)}
              >
                ← {t("newsPrev")}
              </Button>

              <div
                className="text-sm text-muted-foreground"
                aria-live="polite"
              >
                {t("newsPage")} {page} / {pages}
              </div>

              <Button
                variant="outline"
                className="rounded-2xl"
                disabled={page >= pages || loading}
                onClick={() => load(page + 1)}
              >
                {t("newsNext")} →
              </Button>
            </nav>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  )
}