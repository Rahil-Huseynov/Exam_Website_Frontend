"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-toastify"
import { api } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, Search, UploadCloud, X, Image as ImageIcon, Globe } from "lucide-react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

type NewsAdminItem = {
  id: string
  titleAz: string
  titleEn?: string | null
  titleRu?: string | null
  contentAz: string
  contentEn?: string | null
  contentRu?: string | null
  imageUrl?: string | null
  isPublished: boolean
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

type NewsAdminListResponse = {
  items: NewsAdminItem[]
  meta: { page: number; limit: number; total: number; pages: number }
}

type CreateNewsPayload = {
  titleAz: string
  titleEn?: string | null
  titleRu?: string | null
  contentAz: string
  contentEn?: string | null
  contentRu?: string | null
  imageUrl?: string | null
  isPublished?: boolean
}

type UpdateNewsPayload = Partial<CreateNewsPayload>

function truncate(s: string, n = 140) {
  const t = String(s || "")
  return t.length <= n ? t : t.slice(0, n) + "…"
}

const API_URL = process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE || ""
const toAbs = (u: string) => {
  if (!u) return ""
  if (u.startsWith("blob:")) return u
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${API_URL}${u.startsWith("/") ? "" : "/"}${u}`
}

type LangTab = "az" | "en" | "ru"

export default function AdminNewsPage() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NewsAdminItem[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(18)
  const [totalPages, setTotalPages] = useState(1)

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "published" | "draft">("all")

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [editing, setEditing] = useState<NewsAdminItem | null>(null)

  const [titleAz, setTitleAz] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [titleRu, setTitleRu] = useState("")

  const [contentAz, setContentAz] = useState("")
  const [contentEn, setContentEn] = useState("")
  const [contentRu, setContentRu] = useState("")

  const [isPublished, setIsPublished] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  const [tab, setTab] = useState<LangTab>("az")

  const [previewUrl, setPreviewUrl] = useState("")
  const localPreviewRef = useRef<string>("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const cleanupLocalPreview = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current)
      localPreviewRef.current = ""
    }
  }

  useEffect(() => () => cleanupLocalPreview(), [])

  const resetForm = () => {
    setTitleAz("")
    setTitleEn("")
    setTitleRu("")
    setContentAz("")
    setContentEn("")
    setContentRu("")
    setIsPublished(false)
    setImageUrl("")
    setPreviewUrl("")
    setTab("az")
    setEditing(null)
    setMode("create")
    cleanupLocalPreview()
  }

  const openCreate = () => {
    resetForm()
    setMode("create")
    setOpen(true)
  }

  const openEdit = (n: NewsAdminItem) => {
    resetForm()
    setMode("edit")
    setEditing(n)

    setTitleAz(n.titleAz || "")
    setTitleEn(n.titleEn || "")
    setTitleRu(n.titleRu || "")

    setContentAz(n.contentAz || "")
    setContentEn(n.contentEn || "")
    setContentRu(n.contentRu || "")

    setIsPublished(!!n.isPublished)
    setImageUrl(n.imageUrl || "")
    setPreviewUrl(n.imageUrl ? toAbs(n.imageUrl) : "")
    setTab("az")
    setOpen(true)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res: NewsAdminListResponse = await api.adminListNews(page, limit)
      setItems(res.items || [])
      setTotalPages(res.meta?.pages || 1)
    } catch (e: any) {
      toast.error(e?.message || t("adminNewsError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    let arr = items

    if (status !== "all") {
      arr = arr.filter((x) => (status === "published" ? x.isPublished : !x.isPublished))
    }

    if (!q) return arr

    return arr.filter((x) => {
      const tt = `${x.titleAz || ""} ${x.titleEn || ""} ${x.titleRu || ""}`.toLowerCase()
      const cc = `${x.contentAz || ""} ${x.contentEn || ""} ${x.contentRu || ""}`.toLowerCase()
      return tt.includes(q) || cc.includes(q)
    })
  }, [items, search, status])

  const pickFile = () => fileInputRef.current?.click()

  const handleFileSelected = async (file: File) => {
    cleanupLocalPreview()
    const obj = URL.createObjectURL(file)
    localPreviewRef.current = obj
    setPreviewUrl(obj)

    setUploading(true)
    try {
      const res = await api.adminUploadNewsImage(file)
      setImageUrl(res.url)
      toast.success(t("adminNewsImageUploaded"))
    } catch (e: any) {
      toast.error(e?.message || t("adminNewsUploadError"))
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!titleAz.trim()) return toast.error(t("adminNewsTitleAzRequired"))
    if (!contentAz.trim()) return toast.error(t("adminNewsContentAzRequired"))

    const payload: CreateNewsPayload = {
      titleAz: titleAz.trim(),
      titleEn: titleEn.trim() ? titleEn.trim() : null,
      titleRu: titleRu.trim() ? titleRu.trim() : null,

      contentAz: contentAz.trim(),
      contentEn: contentEn.trim() ? contentEn.trim() : null,
      contentRu: contentRu.trim() ? contentRu.trim() : null,

      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      isPublished,
    }

    setLoading(true)
    try {
      if (mode === "create") {
        await api.adminCreateNews(payload as any)
        toast.success(t("adminNewsCreated"))
      } else if (mode === "edit" && editing) {
        const up: UpdateNewsPayload = payload
        await api.adminUpdateNews(editing.id, up as any)
        toast.success(t("adminNewsUpdated"))
      }

      setOpen(false)
      resetForm()
      await load()
    } catch (e: any) {
      toast.error(e?.message || t("adminNewsError"))
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async (n: NewsAdminItem) => {
    setLoading(true)
    try {
      if (!n.isPublished) {
        await api.adminPublishNews(n.id)
        toast.success(t("adminNewsPublishedToast"))
      } else {
        await api.adminUpdateNews(n.id, { isPublished: false } as any)
        toast.success(t("adminNewsUnpublishedToast"))
      }
      await load()
    } catch (e: any) {
      toast.error(e?.message || t("adminNewsError"))
    } finally {
      setLoading(false)
    }
  }

  const remove = async (n: NewsAdminItem) => {
    if (!confirm(`${t("adminNewsDeleteConfirm")} "${n.titleAz}"`)) return
    setLoading(true)
    try {
      await api.adminDeleteNews(n.id)
      toast.success(t("adminNewsDeleted"))
      await load()
    } catch (e: any) {
      toast.error(e?.message || t("adminNewsError"))
    } finally {
      setLoading(false)
    }
  }

  const currentTitle = tab === "az" ? titleAz : tab === "en" ? titleEn : titleRu
  const currentContent = tab === "az" ? contentAz : tab === "en" ? contentEn : contentRu
  const setCurrentTitle = (v: string) => {
    if (tab === "az") setTitleAz(v)
    else if (tab === "en") setTitleEn(v)
    else setTitleRu(v)
  }
  const setCurrentContent = (v: string) => {
    if (tab === "az") setContentAz(v)
    else if (tab === "en") setContentEn(v)
    else setContentRu(v)
  }

  return (
    <div className="space-y-6">
      <div className="w-full px-2 md:px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t("adminNewsHeaderTitle")}</h1>
            <p className="text-muted-foreground text-sm">{t("adminNewsHeaderSubtitle")}</p>
          </div>

          <Button onClick={openCreate} disabled={loading} className="w-full lg:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t("adminNewsNew")}
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-4 lg:p-5">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("adminNewsSearchPlaceholder")}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant={status === "all" ? "default" : "outline"} onClick={() => setStatus("all")}>
                  {t("adminNewsFilterAll")}
                </Button>
                <Button
                  variant={status === "published" ? "default" : "outline"}
                  onClick={() => setStatus("published")}
                >
                  {t("adminNewsFilterPublished")}
                </Button>
                <Button variant={status === "draft" ? "default" : "outline"} onClick={() => setStatus("draft")}>
                  {t("adminNewsFilterDraft")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <Card key={n.id} className="group overflow-hidden">
              <div className="relative">
                {n.imageUrl ? (
                  <img
                    src={toAbs(n.imageUrl)}
                    alt={t("adminNewsImageAlt")}
                    className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : (
                  <div className="h-44 w-full flex items-center justify-center bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-sm">{t("adminNewsNoImage")}</span>
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex gap-2">
                  {n.isPublished ? (
                    <Badge className="bg-background/80 backdrop-blur">{t("adminNewsStatusPublished")}</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                      {t("adminNewsStatusDraft")}
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold leading-snug">{n.titleAz}</h3>
                  <p className="text-sm text-muted-foreground">{truncate(n.contentAz, 140)}</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  {n.publishedAt ? (
                    <>
                      {t("adminNewsPublishedLabel")}: {new Date(n.publishedAt).toLocaleString()}
                    </>
                  ) : (
                    <>
                      {t("adminNewsCreatedLabel")}: {new Date(n.createdAt).toLocaleString()}
                    </>
                  )}
                </div>

                <Separator />

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(n)}
                    disabled={loading}
                    className="flex-1"
                  >
                    {t("adminNewsEdit")}
                  </Button>

                  <Button
                    size="sm"
                    variant={n.isPublished ? "secondary" : "default"}
                    onClick={() => togglePublish(n)}
                    disabled={loading}
                    className="flex-1"
                  >
                    {n.isPublished ? t("adminNewsUnpublish") : t("adminNewsPublish")}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(n)}
                    disabled={loading}
                    className="w-full"
                  >
                    {t("adminNewsDelete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">{t("adminNewsNotFound")}</div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← {t("adminNewsPrev")}
          </Button>
          <div className="text-sm text-muted-foreground">
            {t("adminNewsPage")} {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("adminNewsNext")} →
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (v) setOpen(true)
          else {
            setOpen(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="w-[98vw] sm:w-[96vw] md:w-[92vw] lg:w-[88vw] xl:w-[84vw] 2xl:w-[78vw] max-w-none sm:max-w-[1400px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {mode === "create" ? t("adminNewsModalCreate") : t("adminNewsModalEdit")}
            </DialogTitle>
            <DialogDescription>{t("adminNewsModalDesc")}</DialogDescription>
          </DialogHeader>

          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button type="button" variant={tab === "az" ? "default" : "outline"} onClick={() => setTab("az")}>
                  {t("langAz")}
                </Button>
                <Button type="button" variant={tab === "en" ? "default" : "outline"} onClick={() => setTab("en")}>
                  {t("langEn")}
                </Button>
                <Button type="button" variant={tab === "ru" ? "default" : "outline"} onClick={() => setTab("ru")}>
                  {t("langRu")}
                </Button>

                <div className="ml-auto flex gap-2">
                  <Button type="button" variant={!isPublished ? "default" : "outline"} onClick={() => setIsPublished(false)}>
                    {t("adminNewsDraft")}
                  </Button>
                  <Button type="button" variant={isPublished ? "default" : "outline"} onClick={() => setIsPublished(true)}>
                    {t("adminNewsPublished")}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("adminNewsTitleLabel")} ({tab.toUpperCase()}){" "}
                  {tab === "az" ? <span className="text-destructive">*</span> : null}
                </label>
                <Input
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder={`${t("adminNewsTitlePlaceholder")} ${tab.toUpperCase()}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("adminNewsContentLabel")} ({tab.toUpperCase()}){" "}
                  {tab === "az" ? <span className="text-destructive">*</span> : null}
                </label>
                <Textarea
                  value={currentContent}
                  onChange={(e) => setCurrentContent(e.target.value)}
                  placeholder={`${t("adminNewsContentPlaceholder")} ${tab.toUpperCase()}...`}
                  className="min-h-[320px] resize-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-xl border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">{t("adminNewsAzStatus")}</div>
                  <div className="text-sm font-medium">{titleAz.trim() ? t("adminNewsStatusOk") : t("adminNewsStatusEmpty")}</div>
                </div>
                <div className="rounded-xl border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">{t("adminNewsEnStatus")}</div>
                  <div className="text-sm font-medium">{titleEn.trim() ? t("adminNewsStatusOk") : t("adminNewsStatusFallback")}</div>
                </div>
                <div className="rounded-xl border p-3 bg-muted/20">
                  <div className="text-xs text-muted-foreground">{t("adminNewsRuStatus")}</div>
                  <div className="text-sm font-medium">{titleRu.trim() ? t("adminNewsStatusOk") : t("adminNewsStatusFallback")}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{t("adminNewsImage")}</h3>
                {imageUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageUrl("")
                      setPreviewUrl("")
                      cleanupLocalPreview()
                    }}
                    disabled={uploading || loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("adminNewsRemove")}
                  </Button>
                ) : null}
              </div>

              <div
                className="rounded-2xl border bg-muted/30 p-4 hover:bg-muted/40 transition cursor-pointer"
                onClick={pickFile}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0]
                  if (f) handleFileSelected(f)
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading || loading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelected(f)
                    e.currentTarget.value = ""
                  }}
                />

                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden border bg-background">
                      <img src={toAbs(previewUrl)} alt={t("adminNewsPreviewAlt")} className="w-full h-56 object-cover" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{uploading ? t("adminNewsUploading") : t("adminNewsPreviewReady")}</span>
                      <span>{t("adminNewsMax5mb")}</span>
                    </div>

                    {imageUrl ? (
                      <div className="text-xs text-muted-foreground break-all">
                        {t("adminNewsUrl")}: <span className="font-mono">{imageUrl}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <UploadCloud className="h-7 w-7 text-muted-foreground" />
                    <div className="text-sm font-medium">{t("adminNewsDropTitle")}</div>
                    <div className="text-xs text-muted-foreground">{t("adminNewsDropSub")}</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("adminNewsImageUrlOptional")}</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => {
                    const v = e.target.value
                    setImageUrl(v)
                    cleanupLocalPreview()
                    setPreviewUrl(v ? toAbs(v.trim()) : "")
                  }}
                  placeholder={t("adminNewsImageUrlPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  API: <span className="font-mono">{API_URL || t("adminNewsApiEmpty")}</span>
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              disabled={loading || uploading}
            >
              {t("cancel")}
            </Button>
            <Button onClick={save} disabled={loading || uploading}>
              {loading ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
