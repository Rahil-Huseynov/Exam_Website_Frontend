"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
  ArrowLeft,
  Image as ImageIcon,
  Link2,
} from "lucide-react"

import {
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  LinkedinIcon,
  TwitterIcon,
  WhatsappIcon,
  TelegramIcon,
} from "react-share"

const NEXT_PUBLIC_API_URL_FOR_IMAGE =
  process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE || ""

const SITE_URL = "https://imtahanver.net"

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

  return `${NEXT_PUBLIC_API_URL_FOR_IMAGE}${u.startsWith("/") ? "" : "/"
    }${u}`
}

type NewsLanguage = "az" | "en" | "ru"

export default function NewsDetailClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [item, setItem] =
    useState<PublicNewsItem | null>(null)

  const [loading, setLoading] = useState(true)

  const lang: NewsLanguage = useMemo(() => {
    if (locale === "en") return "en"
    if (locale === "ru") return "ru"
    return "az"
  }, [locale])

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const data = await api.getNewsById(
          id,
          lang
        )

        if (!cancelled) {
          setItem(data)
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(
            error?.message ||
            "Failed to load news"
          )

          setItem(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }

    // Intentionally only reload when the
    // news ID or language changes.
    // Translation function should not trigger API requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, lang])

  const shareUrl =
    `${SITE_URL}/${locale}/news/${encodeURIComponent(id)}`

  const shareTitle = item?.title || ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Back */}
          <Button
            variant="outline"
            className="rounded-2xl cursor-pointer"
            onClick={() =>
              router.push(`/${locale}/news`)
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />

            {t("newsBack") ||
              "Xəbərlərə qayıt"}
          </Button>

          {/* Loading */}
          {loading ? (
            <Card className="border-2 rounded-3xl shadow-xl bg-card/50">
              <CardHeader>
                <div className="h-7 w-3/4 bg-muted rounded-md animate-pulse" />

                <div className="h-4 w-40 bg-muted rounded-md animate-pulse mt-3" />
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="h-48 w-full bg-muted rounded-2xl animate-pulse" />

                <div className="h-4 w-full bg-muted rounded-md animate-pulse" />

                <div className="h-4 w-5/6 bg-muted rounded-md animate-pulse" />

                <div className="h-4 w-4/6 bg-muted rounded-md animate-pulse" />
              </CardContent>
            </Card>
          ) : !item ? (
            /* Not found */
            <Card className="border-2 rounded-3xl shadow-xl bg-card/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                {t("newsNotFound") ||
                  "Xəbər tapılmadı"}
              </CardContent>
            </Card>
          ) : (
            /* News */
            <Card className="border-2 rounded-3xl shadow-xl backdrop-blur-sm bg-card/50 overflow-hidden">

              {/* Image */}
              {item.imageUrl ? (
                <div className="relative p-6 flex items-center justify-center">
                  <img
                    src={toAbsImage(item.imageUrl)}
                    alt={item.title}
                    className="w-2/3 h-full object-cover rounded-2xl"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none"
                    }}
                  />
                </div>
              ) : (
                <div className="h-32 w-full bg-muted/40 flex items-center justify-center">
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

                  <div className="space-y-3 flex-1">

                    <CardTitle className="text-balance text-2xl md:text-3xl leading-tight">
                      {item.title}
                    </CardTitle>

                    <CardDescription className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4" />

                      <time
                        dateTime={
                          item.publishedAt ||
                          item.createdAt
                        }
                      >
                        {(() => {
                          const date = new Date(
                            item.publishedAt || item.createdAt
                          )

                          if (Number.isNaN(date.getTime())) {
                            return item.publishedAt || item.createdAt
                          }

                          if (lang === "az") {
                            const months = [
                              "yanvar",
                              "fevral",
                              "mart",
                              "aprel",
                              "may",
                              "iyun",
                              "iyul",
                              "avqust",
                              "sentyabr",
                              "oktyabr",
                              "noyabr",
                              "dekabr",
                            ]

                            return `${date.getDate()} ${months[date.getMonth()]
                              } ${date.getFullYear()}`
                          }

                          return new Intl.DateTimeFormat(
                            lang === "ru" ? "ru-RU" : "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              timeZone: "Europe/Warsaw",
                            }
                          ).format(date)
                        })()}
                      </time>
                    </CardDescription>

                  </div>
                </div>
              </CardHeader>

              {/* Content */}
              <CardContent>
                <article className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-base md:text-lg">
                    {item.content}
                  </p>
                </article>
              </CardContent>

              {/* Share */}
              <div className="border-t mt-8 p-6">

                <h3 className="text-lg font-semibold mb-4">
                  {t("shareNews") ||
                    "Paylaş"}
                </h3>

                <div className="flex flex-wrap gap-3">

                  <FacebookShareButton
                    url={shareUrl}
                    hashtag="#news"
                  >
                    <FacebookIcon
                      size={42}
                      round
                    />
                  </FacebookShareButton>

                  <TwitterShareButton
                    url={shareUrl}
                    title={shareTitle}
                  >
                    <TwitterIcon
                      size={42}
                      round
                    />
                  </TwitterShareButton>

                  <LinkedinShareButton
                    url={shareUrl}
                    title={shareTitle}
                  >
                    <LinkedinIcon
                      size={42}
                      round
                    />
                  </LinkedinShareButton>

                  <WhatsappShareButton
                    url={shareUrl}
                    title={shareTitle}
                  >
                    <WhatsappIcon
                      size={42}
                      round
                    />
                  </WhatsappShareButton>

                  <TelegramShareButton
                    url={shareUrl}
                    title={shareTitle}
                  >
                    <TelegramIcon
                      size={42}
                      round
                    />
                  </TelegramShareButton>

                  <Button
                    variant="outline"
                    className="rounded-full cursor-pointer"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          shareUrl
                        )

                        toast.success(
                          t("linkCopied") ||
                          "Link copied!"
                        )
                      } catch {
                        toast.error(
                          "Could not copy link"
                        )
                      }
                    }}
                  >
                    <Link2 className="h-5 w-5 rotate-[60deg]" />

                    {t("linkCopy")}
                  </Button>

                </div>
              </div>

            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}