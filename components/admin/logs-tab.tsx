"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { api, type LogItem } from "@/lib/api"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

function safeText(v: any) {
  const s = String(v ?? "").trim()
  return s.length ? s : "-"
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function LogsTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [items, setItems] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const loadLogs = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.getLogs(p, limit)
      setItems(res.data ?? [])
      setTotal(Number(res.total ?? 0))
    } catch {
      toast.error(t("errLogsLoad"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs(1)
  }, [])

  useEffect(() => {
    loadLogs(page)
  }, [page])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items

    return items.filter((x) => {
      const blob = [
        x.id,
        x.level,
        x.action,
        x.message,
        x.adminId,
        x.userId,
        x.createdAt,
        typeof x.meta === "string" ? x.meta : JSON.stringify(x.meta ?? {}),
      ]
        .join(" ")
        .toLowerCase()

      return blob.includes(q)
    })
  }, [items, search])

  const prevDisabled = loading || page <= 1
  const nextDisabled = loading || page >= totalPages

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t("logsTitle")}</CardTitle>
            <CardDescription>{t("logsDesc")}</CardDescription>
          </div>

          <Button
            variant="outline"
            onClick={() => loadLogs(page)}
            disabled={loading}
            className="gap-2 w-full sm:w-auto bg-transparent"
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("search")}</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchLogsPlaceholder")}
            />
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-muted-foreground">
              {t("page")} {page} / {totalPages} • {t("total")}: {total}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-2 bg-transparent"
              >
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">{t("loading")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("noLogsFound")}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((x) => (
                <div key={x.id} className="rounded-xl border p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm sm:text-base flex items-center gap-2">
                        <span>{safeText(x.level)}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatDate(x.createdAt)}</span>
                      </div>

                      <div className="text-sm">{safeText(x.message || x.action)}</div>

                      <div className="text-xs text-muted-foreground">
                        {t("logId")}: {x.id}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {t("adminId")}: {safeText(x.adminId)} • {t("userId")}: {safeText(x.userId)}
                      </div>
                    </div>

                    {x.meta ? (
                      <pre className="w-full sm:w-[420px] max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs">
                        {typeof x.meta === "string" ? x.meta : JSON.stringify(x.meta, null, 2)}
                      </pre>
                    ) : null}
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
