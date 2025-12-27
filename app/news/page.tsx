"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Calendar, Image as ImageIcon, RefreshCcw } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
const toAbs = (u: string) => {
  if (!u) return ""
  if (u.startsWith("blob:")) return u
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${API_URL}${u.startsWith("/") ? "" : "/"}${u}`
}

export default function NewsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [items, setItems] = useState<PublicNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const lang = useMemo(() => (locale === "ru" ? "ru" : locale === "en" ? "en" : "az") as "az" | "en" | "ru", [locale])

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.listNews(lang, p, 12)
      setItems(res.items || [])
      setPages(res.meta?.pages || 1)
    } catch (e: any) {
      toast.error(e?.message || t("newsLoadFailed"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    load(1)
  }, [lang])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("news")}
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">{t("newsSubtitle")}</p>
            </div>

            <Button variant="outline" className="rounded-2xl" onClick={() => load(page)} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("newsRefresh")}
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-2 rounded-3xl shadow-xl bg-card/50">
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
            <Card className="border-2 rounded-3xl shadow-xl bg-card/50">
              <CardContent className="p-8 text-center text-muted-foreground">{t("newsEmpty")}</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="border-2 rounded-3xl shadow-xl backdrop-blur-sm bg-card/50 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  {item.imageUrl ? (
                    <div className="relative">
                      <img
                        src={toAbs(item.imageUrl)}
                        alt={t("newsImageAlt")}
                        className="h-56 w-full object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-full bg-muted/40 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-sm">{t("newsNoImage")}</span>
                      </div>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-balance text-xl">{item.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>

                      <Badge className="bg-gradient-to-r from-primary via-secondary to-accent text-white border-0">
                        {t("newsBadge")}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && pages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const p = page - 1
                  setPage(p)
                  load(p)
                }}
              >
                ← {t("newsPrev")}
              </Button>

              <div className="text-sm text-muted-foreground">
                {t("newsPage")} {page} / {pages}
              </div>

              <Button
                variant="outline"
                className="rounded-2xl"
                disabled={page >= pages || loading}
                onClick={() => {
                  const p = page + 1
                  setPage(p)
                  load(p)
                }}
              >
                {t("newsNext")} →
              </Button>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  )
}
