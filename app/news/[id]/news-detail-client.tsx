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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowLeft, Image as ImageIcon, Link2 } from "lucide-react"
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

const NEXT_PUBLIC_API_URL_FOR_IMAGE = process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE || ""

const toAbsImage = (u: string) => {
  if (!u) return ""
  if (u.startsWith("blob:")) return u
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${NEXT_PUBLIC_API_URL_FOR_IMAGE}${u.startsWith("/") ? "" : "/"}${u}`
}

export default function NewsDetailClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [item, setItem] = useState<PublicNewsItem | null>(null)
  const [loading, setLoading] = useState(true)

  const lang = useMemo(
    () => (locale === "ru" ? "ru" : locale === "en" ? "en" : "az") as "az" | "en" | "ru",
    [locale]
  )

  useEffect(() => {
    if (!id) return

    const load = async () => {
      setLoading(true)
      try {
        const data = await api.getNewsById(id, lang)
        setItem(data)
      } catch (e: any) {
        toast.error(e?.message || t("newsLoadFailed"))
        setItem(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, lang])

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const shareTitle = item?.title || ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => router.push("/news")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("newsBack") || "Xəbərlərə qayıt"}
          </Button>

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
            <Card className="border-2 rounded-3xl shadow-xl bg-card/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                {t("newsNotFound") || "Xəbər tapılmadı"}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 rounded-3xl shadow-xl backdrop-blur-sm bg-card/50 overflow-hidden">
              {item.imageUrl ? (
                <div className="relative p-6 flex items-center justify-center">
                  <img
                    src={toAbsImage(item.imageUrl)}
                    alt={item.title}
                    className="w-2/3 h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              ) : (
                <div className="h-32 w-full bg-muted/40 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm">{t("newsNoImage")}</span>
                  </div>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <CardTitle className="text-balance text-2xl md:text-3xl leading-tight">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>

                  <Badge className="bg-gradient-to-r from-primary via-secondary to-accent text-white border-0 shrink-0">
                    {t("newsBadge")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-base md:text-lg">
                    {item.content}
                  </p>
                </div>
              </CardContent>

              <div className="border-t mt-8 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t("shareNews") || "Paylaş"}
                </h3>

                <div className="flex flex-wrap gap-3">
                  <FacebookShareButton url={shareUrl} hashtag="#news">
                    <FacebookIcon size={42} round />
                  </FacebookShareButton>

                  <TwitterShareButton url={shareUrl} title={shareTitle}>
                    <TwitterIcon size={42} round />
                  </TwitterShareButton>

                  <LinkedinShareButton url={shareUrl} title={shareTitle}>
                    <LinkedinIcon size={42} round />
                  </LinkedinShareButton>

                  <WhatsappShareButton url={shareUrl} title={shareTitle}>
                    <WhatsappIcon size={42} round />
                  </WhatsappShareButton>

                  <TelegramShareButton url={shareUrl} title={shareTitle}>
                    <TelegramIcon size={42} round />
                  </TelegramShareButton>

                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl)
                      toast.success(t("linkCopied") || "Link copied!")
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