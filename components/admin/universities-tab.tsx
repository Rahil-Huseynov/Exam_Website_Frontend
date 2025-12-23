"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type University } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2 } from "lucide-react"

export function UniversitiesTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newUniversity, setNewUniversity] = useState({ az: "", en: "", ru: "" })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadUniversities()
  }, [])

  async function loadUniversities() {
    try {
      setLoading(true)
      const data = await api.getUniversities()
      setUniversities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load universities")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!newUniversity.az || !newUniversity.en || !newUniversity.ru) {
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
      await api.createUniversity(newUniversity.az, newUniversity.az, newUniversity.en, newUniversity.ru)
      setSuccess(t("success"))
      setNewUniversity({ az: "", en: "", ru: "" })
      await loadUniversities()
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
          <CardTitle>{t("addUniversity")}</CardTitle>
          <CardDescription>
            {locale === "az" && "Yeni universitet əlavə edin (bütün dillərdə)"}
            {locale === "en" && "Add a new university (in all languages)"}
            {locale === "ru" && "Добавить новый университет (на всех языках)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name-az">Azərbaycan</Label>
              <Input
                id="name-az"
                value={newUniversity.az}
                onChange={(e) => setNewUniversity({ ...newUniversity, az: e.target.value })}
                placeholder="Bakı Dövlət Universiteti"
                disabled={adding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-en">English</Label>
              <Input
                id="name-en"
                value={newUniversity.en}
                onChange={(e) => setNewUniversity({ ...newUniversity, en: e.target.value })}
                placeholder="Baku State University"
                disabled={adding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-ru">Русский</Label>
              <Input
                id="name-ru"
                value={newUniversity.ru}
                onChange={(e) => setNewUniversity({ ...newUniversity, ru: e.target.value })}
                placeholder="Бакинский государственный университет"
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
          <CardTitle>{t("manageUniversities")}</CardTitle>
          <CardDescription>
            {locale === "az" && "Mövcud universitetlərin siyahısı"}
            {locale === "en" && "List of existing universities"}
            {locale === "ru" && "Список существующих университетов"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : universities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("noData")}</p>
          ) : (
            <div className="space-y-2">
              {universities.map((uni) => (
                <div key={uni.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{uni.name}</p>
                    <p className="text-sm text-muted-foreground">
                      AZ: {uni.nameAz} | EN: {uni.nameEn} | RU: {uni.nameRu}
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
