"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type University } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2, X, Check, Upload } from "lucide-react"
import { toastConfirm, toastError, toastSuccess } from "@/lib/toast"

export function UniversitiesTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)

  const [newUniversity, setNewUniversity] = useState({ az: "", en: "", ru: "" })
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUniversity, setEditUniversity] = useState({ az: "", en: "", ru: "" })
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadUniversities()
  }, [])

  function msgAllLang() {
    return t("universities.errors.all_languages_required")
  }

  const apiBase = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_API_URL || ""
    return raw.replace(/\/+$/, "").replace(/\/api$/, "")
  }, [])

  function resolveLogoUrl(logo?: string | null) {
    if (!logo) return ""
    if (/^https?:\/\//i.test(logo)) return logo
    return `${apiBase}${logo.startsWith("/") ? "" : "/"}${logo}`
  }

  async function loadUniversities() {
    try {
      setLoading(true)
      const data = await api.getUniversities()
      setUniversities(data)
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("universities.errors.load_failed"))
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!newUniversity.az || !newUniversity.en || !newUniversity.ru) {
      toastError(msgAllLang())
      return
    }

    try {
      setAdding(true)

      const created = await api.createUniversity(
        newUniversity.az, 
        newUniversity.az, 
        newUniversity.en, 
        newUniversity.ru, 
      )

      if (newLogoFile) {
        await api.uploadUniversityLogo(created.id, newLogoFile)
      }

      toastSuccess(t("success"))
      setNewUniversity({ az: "", en: "", ru: "" })
      setNewLogoFile(null)
      await loadUniversities()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("failed"))
    } finally {
      setAdding(false)
    }
  }

  function startEdit(uni: University) {
    setEditingId(uni.id)
    setEditUniversity({
      az: uni.nameAz || "",
      en: uni.nameEn || "",
      ru: uni.nameRu || "",
    })
    setEditLogoFile(null)  
  }

  function cancelEdit() {
    setEditingId(null)
    setEditUniversity({ az: "", en: "", ru: "" })
    setEditLogoFile(null)
  }

  async function saveEdit(universityId: string) {
    if (!editUniversity.az || !editUniversity.en || !editUniversity.ru) {
      toastError(msgAllLang())
      return
    }

    try {
      setSaving(true)

      await api.updateUniversity(universityId, {
        name: editUniversity.az,
        nameAz: editUniversity.az,
        nameEn: editUniversity.en,
        nameRu: editUniversity.ru,
      })

      if (editLogoFile) {
        await api.uploadUniversityLogo(universityId, editLogoFile)
      }

      toastSuccess(t("success"))
      cancelEdit()
      await loadUniversities()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("failed"))
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(universityId: string) {
    toastConfirm(t("universities.confirm.delete"), async () => {
      try {
        setDeletingId(universityId)
        await api.deleteUniversity(universityId)
        toastSuccess(t("success"))
        await loadUniversities()
      } catch (err) {
        toastError(err instanceof Error ? err.message : t("failed"))
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ADD */}
      <Card>
        <CardHeader>
          <CardTitle>{t("universities.ui.add_title")}</CardTitle>
          <CardDescription>{t("universities.ui.add_desc")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("universities.ui.lang_az")}</Label>
              <Input
                value={newUniversity.az}
                onChange={(e) => setNewUniversity({ ...newUniversity, az: e.target.value })}
                placeholder={t("universities.ui.ph_az")}
                disabled={adding}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("universities.ui.lang_en")}</Label>
              <Input
                value={newUniversity.en}
                onChange={(e) => setNewUniversity({ ...newUniversity, en: e.target.value })}
                placeholder={t("universities.ui.ph_en")}
                disabled={adding}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("universities.ui.lang_ru")}</Label>
              <Input
                value={newUniversity.ru}
                onChange={(e) => setNewUniversity({ ...newUniversity, ru: e.target.value })}
                placeholder={t("universities.ui.ph_ru")}
                disabled={adding}
              />
            </div>
          </div>

          {/* ADD LOGO */}
          <div className="space-y-2">
            <Label>{t("universities.ui.logo") || "Logo"}</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={adding}
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setNewLogoFile(f)
              }}
            />
            {newLogoFile ? (
              <p className="text-xs text-muted-foreground">
                {t("selected") || "Selected"}: {newLogoFile.name}
              </p>
            ) : null}
          </div>

          <Button onClick={handleAdd} disabled={adding}>
            <Plus className="h-4 w-4 mr-2" />
            {adding ? t("processing") : t("add")}
          </Button>
        </CardContent>
      </Card>

      {/* MANAGE */}
      <Card>
        <CardHeader>
          <CardTitle>{t("universities.ui.manage_title")}</CardTitle>
          <CardDescription>{t("universities.ui.manage_desc")}</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : universities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("noData")}</p>
          ) : (
            <div className="space-y-2">
              {universities.map((uni) => {
                const isEditing = editingId === uni.id
                const logoUrl = resolveLogoUrl(uni.logo)

                return (
                  <div key={uni.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-3">
                        {/* Logo preview + upload */}
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                            {logoUrl ? (
                              <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-xs text-muted-foreground">Logo</span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-1">
                              <Label className="text-xs">{t("universities.ui.change_logo") || "Change logo"}</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                disabled={saving}
                                onChange={(e) => setEditLogoFile(e.target.files?.[0] || null)}
                              />
                              {editLogoFile ? (
                                <p className="text-xs text-muted-foreground">
                                  {t("selected") || "Selected"}: {editLogoFile.name}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        {!isEditing ? (
                          <>
                            <p className="font-medium">{uni.name}</p>
                            <p className="text-sm text-muted-foreground">
                              AZ: {uni.nameAz} | EN: {uni.nameEn} | RU: {uni.nameRu}
                            </p>
                          </>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-3">
                            <Input
                              value={editUniversity.az}
                              onChange={(e) => setEditUniversity({ ...editUniversity, az: e.target.value })}
                              disabled={saving}
                            />
                            <Input
                              value={editUniversity.en}
                              onChange={(e) => setEditUniversity({ ...editUniversity, en: e.target.value })}
                              disabled={saving}
                            />
                            <Input
                              value={editUniversity.ru}
                              onChange={(e) => setEditUniversity({ ...editUniversity, ru: e.target.value })}
                              disabled={saving}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => startEdit(uni)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(uni.id)}
                              disabled={deletingId === uni.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => saveEdit(uni.id)} disabled={saving}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={cancelEdit} disabled={saving}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
