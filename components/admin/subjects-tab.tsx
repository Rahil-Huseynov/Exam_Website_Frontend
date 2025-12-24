"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type Subject } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit3, Save, X } from "lucide-react"
import { toastError, toastSuccess, toastConfirm } from "@/lib/toast"

export function SubjectsTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const [newSubject, setNewSubject] = useState({ az: "", en: "", ru: "" })
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ az: "", en: "", ru: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  function msgAllLang() {
    return locale === "az"
      ? "Bütün dillərdə ad daxil edin"
      : locale === "ru"
        ? "Введите название на всех языках"
        : "Enter name in all languages"
  }

  async function loadSubjects() {
    try {
      setLoading(true)
      const data = await api.getSubjects()
      setSubjects(data)
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to load subjects")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!newSubject.az || !newSubject.en || !newSubject.ru) {
      toastError(msgAllLang())
      return
    }

    try {
      setAdding(true)
      await api.createSubject(newSubject.az, newSubject.az, newSubject.en, newSubject.ru)
      toastSuccess(t("success"))
      setNewSubject({ az: "", en: "", ru: "" })
      await loadSubjects()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("failed"))
    } finally {
      setAdding(false)
    }
  }

  function startEdit(subj: Subject) {
    setEditingId(subj.id)
    setEditForm({
      az: subj.nameAz || "",
      en: subj.nameEn || "",
      ru: subj.nameRu || "",
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ az: "", en: "", ru: "" })
  }

  async function handleSaveEdit(subjectId: string) {
    if (!editForm.az || !editForm.en || !editForm.ru) {
      toastError(msgAllLang())
      return
    }

    try {
      setSaving(true)
      await api.updateSubject(subjectId, {
        name: editForm.az,
        nameAz: editForm.az,
        nameEn: editForm.en,
        nameRu: editForm.ru,
      })
      toastSuccess(t("success"))
      cancelEdit()
      await loadSubjects()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("failed"))
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteSubject(subjectId: string) {
    toastConfirm(
      locale === "az"
        ? "Bu fənn silinsin?"
        : locale === "ru"
          ? "Удалить предмет?"
          : "Delete subject?",
      async () => {
        try {
          await api.deleteSubject(subjectId)
          toastSuccess(t("success"))
          await loadSubjects()
        } catch (err) {
          toastError(err instanceof Error ? err.message : t("failed"))
        }
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* ADD */}
      <Card>
        <CardHeader>
          <CardTitle>{t("addSubject")}</CardTitle>
          <CardDescription>
            {locale === "az" && "Yeni fənn əlavə edin (bütün dillərdə)"}
            {locale === "en" && "Add a new subject (in all languages)"}
            {locale === "ru" && "Добавить новый предмет (на всех языках)"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="subj-az">Azərbaycan</Label>
              <Input
                id="subj-az"
                value={newSubject.az}
                onChange={(e) => setNewSubject({ ...newSubject, az: e.target.value })}
                placeholder="Riyaziyyat"
                disabled={adding}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subj-en">English</Label>
              <Input
                id="subj-en"
                value={newSubject.en}
                onChange={(e) => setNewSubject({ ...newSubject, en: e.target.value })}
                placeholder="Mathematics"
                disabled={adding}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subj-ru">Русский</Label>
              <Input
                id="subj-ru"
                value={newSubject.ru}
                onChange={(e) => setNewSubject({ ...newSubject, ru: e.target.value })}
                placeholder="Математика"
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

      {/* LIST + EDIT + DELETE */}
      <Card>
        <CardHeader>
          <CardTitle>{t("manageSubjects")}</CardTitle>
          <CardDescription>
            {locale === "az" && "Mövcud fənnlərin siyahısı"}
            {locale === "en" && "List of existing subjects"}
            {locale === "ru" && "Список существующих предметов"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : subjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("noData")}</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((subj) => {
                const isEditing = editingId === subj.id

                return (
                  <div key={subj.id} className="p-4 border rounded-lg space-y-3">
                    {!isEditing ? (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{subj.name}</p>
                          <p className="text-sm text-muted-foreground">
                            AZ: {subj.nameAz} | EN: {subj.nameEn} | RU: {subj.nameRu}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(subj)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteSubject(subj.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Azərbaycan</Label>
                            <Input
                              value={editForm.az}
                              onChange={(e) => setEditForm({ ...editForm, az: e.target.value })}
                              disabled={saving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>English</Label>
                            <Input
                              value={editForm.en}
                              onChange={(e) => setEditForm({ ...editForm, en: e.target.value })}
                              disabled={saving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Русский</Label>
                            <Input
                              value={editForm.ru}
                              onChange={(e) => setEditForm({ ...editForm, ru: e.target.value })}
                              disabled={saving}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                            <X className="h-4 w-4 mr-2" />
                            {locale === "az" ? "Ləğv et" : locale === "ru" ? "Отмена" : "Cancel"}
                          </Button>

                          <Button onClick={() => handleSaveEdit(subj.id)} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving
                              ? t("processing")
                              : locale === "az"
                                ? "Yadda saxla"
                                : locale === "ru"
                                  ? "Сохранить"
                                  : "Save"}
                          </Button>
                        </div>
                      </>
                    )}
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
