"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { api, type AdminResultItem } from "@/lib/api"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

function safe(v: any) {
  const s = String(v ?? "").trim()
  return s ? s : "-"
}

function fullName(u: any) {
  const n = `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim()
  return n || "-"
}

function fmtDate(iso?: string | null) {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function pct(score: number, total: number) {
  if (!total) return "0%"
  const v = Math.round((score / total) * 100)
  return `${v}%`
}

export function ResultsTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [items, setItems] = useState<AdminResultItem[]>([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"" | "FINISHED" | "IN_PROGRESS">("")

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.adminListResults({
        page: p,
        limit,
        q: q.trim(),
        status: status || undefined,
      })
      setItems(res.items ?? [])
      setTotal(res.total ?? 0)
      setPages(res.pages ?? 1)
      setPage(res.page ?? p)
    } catch {
      toast.error(t("errResultsLoad"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [])

  useEffect(() => {
    load(page)
  }, [page])

  const onSearch = async () => {
    setPage(1)
    await load(1)
  }

  const prevDisabled = loading || page <= 1
  const nextDisabled = loading || page >= pages

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t("resultsTitle")}</CardTitle>
            <CardDescription>{t("resultsDesc")}</CardDescription>
          </div>

          <Button
            variant="outline"
            onClick={() => load(page)}
            disabled={loading}
            className="gap-2 w-full sm:w-auto bg-transparent"
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className="grid gap-2 sm:col-span-3">
              <Label>{t("search")}</Label>
              <div className="flex gap-2">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("searchResultsPlaceholder")}
                />
                <Button onClick={onSearch} disabled={loading}>
                  {t("search")}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-muted-foreground">
              {t("page")} {page} / {pages} • {t("total")}: {total}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={prevDisabled}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-2 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("prev")}
              </Button>

              <Button
                variant="outline"
                disabled={nextDisabled}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="gap-2 bg-transparent"
              >
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">{t("loading")}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("noResultsFound")}</div>
          ) : (
            <div className="space-y-3">
              {items.map((x) => (
                <div key={x.id} className="rounded-xl border p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm sm:text-base">
                        {fullName(x.user)} • {safe(x.user.email)}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        publicId: {safe(x.user.publicId)} • attemptId: {x.id}
                      </div>

                      <div className="text-sm">
                        {safe(x.bank?.title)} ({safe(x.bank?.year)}) • {safe(x.bank?.university?.name)} •{" "}
                        {safe(x.bank?.subject?.name)}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {t("status")}: {x.status} • {t("startedAt")}: {fmtDate(x.startedAt)} • {t("finishedAt")}:{" "}
                        {fmtDate(x.finishedAt)}
                      </div>
                    </div>

                    <div className="rounded-xl border px-4 py-3 text-center min-w-[140px]">
                      <div className="text-xs text-muted-foreground">{t("score")}</div>
                      <div className="text-lg font-semibold">
                        {x.score}/{x.total}
                      </div>
                      <div className="text-xs text-muted-foreground">{pct(x.score, x.total)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
