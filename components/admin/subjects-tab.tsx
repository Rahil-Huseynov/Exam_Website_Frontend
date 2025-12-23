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
import { Plus, Trash2 } from "lucide-react"

export function SubjectsTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newSubject, setNewSubject] = useState({ az: "", en: "", ru: "" })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      setLoading(true)
      const data = await api.getSubjects()
      setSubjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!newSubject.az || !newSubject.en || !newSubject.ru) {
      setError(
        locale === "az"
          ? "Bütün dillərdə ad daxil edin"
          : locale === "ru"
            ? "Введите название на всех языках"
            : "Enter name in all languages",
      )
      return
    }

    try {
      setAdding(true)
      setError("")
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
              {subjects.map((subj) => (
                <div key={subj.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{subj.name}</p>
                    <p className="text-sm text-muted-foreground">
                      AZ: {subj.nameAz} | EN: {subj.nameEn} | RU: {subj.nameRu}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
