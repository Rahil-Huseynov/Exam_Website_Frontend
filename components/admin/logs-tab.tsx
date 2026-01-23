"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { api, LogItem } from "@/lib/api"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

/* ================= HELPERS ================= */

const safe = (v: any, dash = "-") =>
  v === null || v === undefined || v === "" ? dash : String(v)

const dateFmt = (d: string) => {
  try {
    return new Date(d).toLocaleString()
  } catch {
    return d
  }
}

const statusColor = (s: number) => {
  if (s >= 500) return "text-red-600 bg-red-50 border-red-300"
  if (s >= 400) return "text-orange-600 bg-orange-50 border-orange-300"
  if (s >= 300) return "text-yellow-600 bg-yellow-50 border-yellow-300"
  return "text-green-600 bg-green-50 border-green-300"
}

/* ================= COMPONENT ================= */

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
      toast.error(t("logs.loadError"))
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
    const q = search.toLowerCase().trim()
    if (!q) return items
    return items.filter((x) =>
      JSON.stringify(x).toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div>
          <CardTitle>{t("logs.title")}</CardTitle>
          <CardDescription>{t("logs.description")}</CardDescription>
        </div>

        <Button
          variant="outline"
          onClick={() => loadLogs(page)}
          disabled={loading}
          className="gap-2 bg-transparent"
        >
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh")}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>{t("common.search")}</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("logs.searchPlaceholder")}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {t("common.page")} {page} / {totalPages} •{" "}
            {t("common.total")}: {total}
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("common.prev")}
            </Button>

            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="bg-transparent"
            >
              {t("common.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("logs.noResults")}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((x) => (
              <div
                key={x.id}
                className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="px-2 py-1 rounded bg-muted">
                      {x.method}
                    </span>

                    <span
                      className={`px-2 py-1 rounded border text-xs ${statusColor(
                        x.status
                      )}`}
                    >
                      {x.status}
                    </span>

                    <span className="text-muted-foreground text-xs">
                      {x.duration} {t("logs.ms")}
                    </span>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {dateFmt(x.createdAt)}
                  </span>
                </div>

                <div className="mt-2 font-mono text-sm break-all">
                  {x.url}
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  <div><b>{t("logs.ip")}:</b> {safe(x.ip)}</div>
                  <div><b>{t("logs.isp")}:</b> {safe(x.isp)}</div>
                  <div><b>{t("logs.asn")}:</b> {safe(x.asn)}</div>

                  <div><b>{t("logs.country")}:</b> {safe(x.country)}</div>
                  <div><b>{t("logs.region")}:</b> {safe(x.region)}</div>
                  <div><b>{t("logs.city")}:</b> {safe(x.city)}</div>

                  <div><b>{t("logs.device")}:</b> {safe(x.deviceType)}</div>
                  <div><b>{t("logs.browser")}:</b> {safe(x.browser)} {safe(x.browserVer)}</div>
                  <div><b>{t("logs.os")}:</b> {safe(x.os)} {safe(x.osVersion)}</div>

                  <div><b>{t("logs.userId")}:</b> {safe(x.userId)}</div>
                  <div><b>{t("logs.user")}:</b> {safe(x.userName)}</div>
                  <div><b>{t("logs.role")}:</b> {safe(x.userRole)}</div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-primary">
                    {t("logs.userAgent")}
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-3 rounded-xl overflow-auto">
                    {safe(x.userAgent)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
