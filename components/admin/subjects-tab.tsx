"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type Subject } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Edit3, Save, X } from "lucide-react"

export function SubjectsTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [newSubject, setNewSubject] = useState({ az: "", en: "", ru: "" })
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ az: "", en: "", ru: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSubjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSubjects() {
    try {
      setLoading(true)
      setError("")
      const data = await api.getSubjects()
      setSubjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects")
    } finally {
      setLoading(false)
    }
  }

  function localMsg(allLang: string) {
    if (locale === "az") return "Bütün dillərdə ad daxil edin"
    if (locale === "ru") return "Введите название на всех языках"
    return "Enter name in all languages"
  }

  async function handleAdd() {
    if (!newSubject.az || !newSubject.en || !newSubject.ru) {
      setError(localMsg("all"))
      return
    }

    try {
      setAdding(true)
      setError("")
      setSuccess("")

      // name kimi AZ göndəririk
      await api.createSubject(newSubject.az, newSubject.az, newSubject.en, newSubject.ru)

      setSuccess(t("success"))
      setNewSubject({ az: "", en: "", ru: "" })
      await loadSubjects()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"))
    } finally {
      setAdding(false)
    }
  }

  function startEdit(subj: Subject) {
    setError("")
    setSuccess("")
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
      setError(localMsg("all"))
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      await api.updateSubject(subjectId, {
        name: editForm.az,
        nameAz: editForm.az,
        nameEn: editForm.en,
        nameRu: editForm.ru,
      })

      setSuccess(t("success"))
      cancelEdit()
      await loadSubjects()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSubject(subjectId: string) {
    const ok = window.confirm(
      locale === "az"
        ? "Bu fənni silmək istədiyinizə əminsiniz?"
        : locale === "ru"
          ? "Вы уверены, что хотите удалить предмет?"
          : "Are you sure you want to delete this subject?",
    )
    if (!ok) return

    try {
      setError("")
      setSuccess("")
      await api.deleteSubject(subjectId)
      setSuccess(t("success"))
      await loadSubjects()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"))
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                            {saving ? t("processing") : locale === "az" ? "Yadda saxla" : locale === "ru" ? "Сохранить" : "Save"}
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
