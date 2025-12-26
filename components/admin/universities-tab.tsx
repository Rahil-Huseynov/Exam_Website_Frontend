"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type University } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2, X, Check } from "lucide-react"
import { toastConfirm, toastError, toastSuccess } from "@/lib/toast"

export function UniversitiesTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)

  const [newUniversity, setNewUniversity] = useState({ az: "", en: "", ru: "" })
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUniversity, setEditUniversity] = useState({ az: "", en: "", ru: "" })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadUniversities()
  }, [])

  function msgAllLang() {
    return t("universities.errors.all_languages_required")
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
      await api.createUniversity(
        newUniversity.az,
        newUniversity.az,
        newUniversity.en,
        newUniversity.ru,
      )
      toastSuccess(t("success"))
      setNewUniversity({ az: "", en: "", ru: "" })
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
  }

  function cancelEdit() {
    setEditingId(null)
    setEditUniversity({ az: "", en: "", ru: "" })
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

          <Button onClick={handleAdd} disabled={adding}>
            <Plus className="h-4 w-4 mr-2" />
            {adding ? t("processing") : t("add")}
          </Button>
        </CardContent>
      </Card>

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

                return (
                  <div key={uni.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
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
