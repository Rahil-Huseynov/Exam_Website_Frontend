"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type Exam, type University, type Subject } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText } from "lucide-react"

export function ExamsTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [exams, setExams] = useState<Exam[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    universityId: "",
    subjectId: "",
    year: new Date().getFullYear().toString(),
    price: "5.00",
    file: null as File | null,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [examsData, universitiesData, subjectsData] = await Promise.all([
        api.getExams(),
        api.getUniversities(),
        api.getSubjects(),
      ])
      setExams(examsData)
      setUniversities(universitiesData)
      setSubjects(subjectsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!formData.file || !formData.universityId || !formData.subjectId) {
      setError(locale === "az" ? "Bütün xanaları doldurun" : locale === "ru" ? "Заполните все поля" : "Fill all fields")
      return
    }

    try {
      setUploading(true)
      setError("")

      const pdfResult = await api.uploadPDF(formData.file)

      await api.createExam({
        universityId: Number(formData.universityId),
        subjectId: Number(formData.subjectId),
        year: Number(formData.year),
        price: Number.parseFloat(formData.price),
        questions: pdfResult.questions,
      })

      setSuccess(t("success"))
      setFormData({
        universityId: "",
        subjectId: "",
        year: new Date().getFullYear().toString(),
        price: "5.00",
        file: null,
      })
      await loadData()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"))
    } finally {
      setUploading(false)
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
          <CardTitle>{t("uploadExamPDF")}</CardTitle>
          <CardDescription>
            {locale === "az" && "İmtahan suallarını PDF formatında yükləyin"}
            {locale === "en" && "Upload exam questions in PDF format"}
            {locale === "ru" && "Загрузите вопросы экзамена в формате PDF"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("university")}</Label>
              <Select
                value={formData.universityId}
                onValueChange={(v) => setFormData({ ...formData, universityId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("university")} />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id.toString()}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("subject")}</Label>
              <Select value={formData.subjectId} onValueChange={(v) => setFormData({ ...formData, subjectId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("subject")} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.id} value={subj.id.toString()}>
                      {subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("year")}</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("price")} (AZN)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={uploading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("selectPDF")}</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
              disabled={uploading}
            />
            {formData.file && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {formData.file.name}
              </p>
            )}
          </div>

          <Button onClick={handleUpload} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? t("uploading") : t("uploadPDF")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("manageExams")}</CardTitle>
          <CardDescription>
            {locale === "az" && "Mövcud imtahanların siyahısı"}
            {locale === "en" && "List of existing exams"}
            {locale === "ru" && "Список существующих экзаменов"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("noData")}</p>
          ) : (
            <div className="space-y-2">
              {exams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.university.name} • {exam.subject.name} • {exam.year}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {exam.questionCount} {t("questions")} • {exam.price.toFixed(2)} AZN
                    </p>
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
