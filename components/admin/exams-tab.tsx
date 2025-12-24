"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type Exam, type University, type Subject, type DraftQuestion, type AdminQuestion } from "@/lib/api"
import { readPdfText } from "@/lib/pdf-read"
import { parseQuestionsFromText } from "@/lib/pdf-parser"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, CheckCircle2, Eye, Trash2, Pencil, Plus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL

type DraftSelectionMap = Record<string, string> 
function normText(s: string) {
  return (s || "").trim().replace(/\s+/g, " ")
}

export function ExamsTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [exams, setExams] = useState<Exam[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [busy, setBusy] = useState(false)

  const [examForm, setExamForm] = useState({
    title: "",
    universityId: "",
    subjectId: "",
    year: new Date().getFullYear().toString(),
    price: "5.00",
  })

  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)

  const [draft, setDraft] = useState<DraftQuestion[]>([])
  const [selectedCorrect, setSelectedCorrect] = useState<DraftSelectionMap>({})
  const [draftModalOpen, setDraftModalOpen] = useState(false)
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [manageBankId, setManageBankId] = useState<string>("")
  const [bankQuestions, setBankQuestions] = useState<AdminQuestion[]>([])
  const [qBusy, setQBusy] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newQText, setNewQText] = useState("")
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""])
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0)

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

  function resetDraftState() {
    setDraft([])
    setSelectedCorrect({})
    setDraftModalOpen(false)
  }

  function resetAddState() {
    setNewQText("")
    setNewOptions(["", "", "", ""])
    setNewCorrectIndex(0)
    setAddModalOpen(false)
  }

  const canCreateExam = useMemo(() => {
    return !!examForm.title && !!examForm.universityId && !!examForm.subjectId && !!examForm.year && !!examForm.price
  }, [examForm])

  const canReadPdfFront = useMemo(() => {
    return !!selectedExamId && !!file
  }, [selectedExamId, file])

  const canCommit = useMemo(() => {
    if (!selectedExamId || draft.length === 0) return false
    return draft.some((q) => !!selectedCorrect[q.tempId])
  }, [selectedExamId, draft, selectedCorrect])

  const draftAnsweredCount = useMemo(() => {
    if (!draft.length) return 0
    return draft.filter((q) => !!selectedCorrect[q.tempId]).length
  }, [draft, selectedCorrect])

  const canAddQuestion = useMemo(() => {
    const qText = normText(newQText)
    const opts = newOptions.map(normText).filter(Boolean)
    const uniq = new Set(opts.map((x) => x.toLowerCase()))
    return qText.length > 0 && opts.length >= 2 && uniq.size >= 2 && newCorrectIndex >= 0 && newCorrectIndex < newOptions.length
  }, [newQText, newOptions, newCorrectIndex])

  async function handleCreateExam() {
    if (!canCreateExam) {
      setError(locale === "az" ? "Bütün xanaları doldurun" : locale === "ru" ? "Заполните все поля" : "Fill all fields")
      return
    }

    try {
      setBusy(true)
      setError("")
      setSuccess("")

      const created = await api.createExam({
        title: examForm.title,
        universityId: examForm.universityId,
        subjectId: examForm.subjectId,
        year: Number(examForm.year),
        price: Number.parseFloat(examForm.price),
      })

      setSelectedExamId(created.id)
      setExamForm({
        title: "",
        universityId: "",
        subjectId: "",
        year: new Date().getFullYear().toString(),
        price: "5.00",
      })

      setSuccess(locale === "az" ? "İmtahan yaradıldı" : locale === "ru" ? "Экзамен создан" : "Exam created")
      await loadData()
      setTimeout(() => setSuccess(""), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleReadPdfFront() {
    if (!canReadPdfFront) {
      setError(locale === "az" ? "Exam seç və PDF seç" : locale === "ru" ? "Выберите экзамен и PDF" : "Select exam and PDF")
      return
    }

    try {
      setBusy(true)
      setError("")
      setSuccess("")
      resetDraftState()

      console.log("PDF start:", file!.name, file!.type, file!.size)

      const text = await readPdfText(file!)
      console.log("PDF text length:", text.length)

      const parsed = parseQuestionsFromText(text)
      console.log("Parsed questions:", parsed.length)

      if (!parsed.length) {
        throw new Error(locale === "az" ? "PDF-dən sual tapılmadı (format parser-ə uyğun deyil)" : "No questions found")
      }

      setDraft(parsed)
      setSelectedCorrect({})
      setDraftModalOpen(true)
    } catch (err: any) {
      console.error("PDF error:", err)
      setError(err?.message || "PDF read failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleCommit() {
    if (!canCommit) {
      setError(locale === "az" ? "Ən az 1 sual üçün doğru variant seç" : locale === "ru" ? "Выберите хотя бы 1 ответ" : "Select at least 1")
      return
    }

    try {
      setBusy(true)
      setError("")
      setSuccess("")

      const payload = {
        questions: draft
          .filter((q) => !!selectedCorrect[q.tempId])
          .map((q) => {
            const correctTempId = selectedCorrect[q.tempId]
            const correctOpt = q.options.find((o) => o.tempOptionId === correctTempId)
            if (!correctOpt) throw new Error("Correct option tapılmadı")

            return {
              text: q.text,
              options: q.options.map((o) => ({ text: o.text })),
              correctAnswerText: correctOpt.text,
            }
          }),
      }

      await api.importQuestionsDirect(selectedExamId, payload)

      setSuccess(locale === "az" ? "Seçilən suallar DB-yə yazıldı" : locale === "ru" ? "Сохранено" : "Saved")
      resetDraftState()
      setFile(null)

      await loadData()
      setTimeout(() => setSuccess(""), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed")
    } finally {
      setBusy(false)
    }
  }

  async function openManageQuestions(bankId: string) {
    try {
      setQBusy(true)
      setError("")
      setManageBankId(bankId)

      const res = await api.listBankQuestions(bankId)
      setBankQuestions(res.questions)

      setManageModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions")
    } finally {
      setQBusy(false)
    }
  }

  async function handleDeleteExam(bankId: string) {
    if (!confirm(locale === "az" ? "İmtahan silinsin?" : locale === "ru" ? "Удалить экзамен?" : "Delete exam?")) return

    try {
      setBusy(true)
      setError("")
      await api.deleteBank(bankId)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm(locale === "az" ? "Sual silinsin?" : locale === "ru" ? "Удалить вопрос?" : "Delete question?")) return

    try {
      setQBusy(true)
      setError("")
      await api.deleteQuestion(questionId)

      setBankQuestions((prev) => prev.filter((x) => x.id !== questionId))
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setQBusy(false)
    }
  }

  async function handleSaveQuestion(q: AdminQuestion) {
    try {
      setQBusy(true)
      setError("")

      const payload = {
        text: q.text,
        options: q.options.map((o) => ({ text: o.text })),
        correctAnswerText: q.correctAnswerText || "",
      }

      const updated = await api.updateQuestion(q.id, payload)
      setBankQuestions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setQBusy(false)
    }
  }

  async function handleAddQuestion() {
    if (!API_URL) {
      setError("NEXT_PUBLIC_API_URL tapılmadı. .env-də set et.")
      return
    }
    if (!manageBankId) {
      setError("Bank seçilməyib")
      return
    }
    if (!canAddQuestion) {
      setError(locale === "az" ? "Sual, ən az 2 unik variant və doğru cavabı seç" : "Fill question, 2 unique options and pick correct")
      return
    }

    const qText = normText(newQText)
    const opts = newOptions.map(normText).filter(Boolean)

    const seen = new Set<string>()
    const finalOpts: string[] = []
    for (const o of opts) {
      const k = o.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      finalOpts.push(o)
    }

    const correctText = normText(newOptions[newCorrectIndex] || "")
    if (!correctText) {
      setError(locale === "az" ? "Doğru cavabı seç" : "Select correct answer")
      return
    }

    const correctIn = finalOpts.find((x) => x.toLowerCase() === correctText.toLowerCase())
    if (!correctIn) {
      setError(locale === "az" ? "Doğru cavab variantların içində deyil" : "Correct not in options")
      return
    }

    try {
      setQBusy(true)
      setError("")
      setSuccess("")

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (process.env.NEXT_PUBLIC_API_KEY) headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY
      const token = api.getToken()
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch(`${API_URL}/questions/bank/${encodeURIComponent(manageBankId)}/questions`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          text: qText,
          options: finalOpts.map((x) => ({ text: x })),
          correctAnswerText: correctIn,
        }),
      })

      if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to add question")
        throw new Error(msg || "Failed to add question")
      }

      const created = (await res.json()) as AdminQuestion

      setBankQuestions((prev) => [created, ...prev])
      setSuccess(locale === "az" ? "Sual əlavə olundu" : "Question added")
      resetAddState()
      await loadData()
      setTimeout(() => setSuccess(""), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed")
    } finally {
      setQBusy(false)
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

      {/* 1) Create exam */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "az" ? "İmtahan yarat" : locale === "ru" ? "Создать экзамен" : "Create exam"}</CardTitle>
          <CardDescription>
            {locale === "az"
              ? "Universitet, fənn, il və qiymət ilə exam yarat"
              : locale === "ru"
                ? "Создайте экзамен по университету, предмету, году и цене"
                : "Create exam with university, subject, year and price"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                disabled={busy}
                placeholder="MİDTERM - 2025"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("year")}</Label>
              <Input
                type="number"
                value={examForm.year}
                onChange={(e) => setExamForm({ ...examForm, year: e.target.value })}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("university")}</Label>
              <Select value={examForm.universityId} onValueChange={(v) => setExamForm({ ...examForm, universityId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("university")} />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("subject")}</Label>
              <Select value={examForm.subjectId} onValueChange={(v) => setExamForm({ ...examForm, subjectId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("subject")} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("price")} (AZN)</Label>
              <Input
                type="number"
                step="0.01"
                value={examForm.price}
                onChange={(e) => setExamForm({ ...examForm, price: e.target.value })}
                disabled={busy}
              />
            </div>
          </div>

          <Button onClick={handleCreateExam} disabled={busy || !canCreateExam}>
            {busy ? t("processing") : locale === "az" ? "Yarat" : locale === "ru" ? "Создать" : "Create"}
          </Button>
        </CardContent>
      </Card>

      {/* 2) Select exam + PDF front read */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "az"
              ? "PDF oxu (FRONT) və correct seç"
              : locale === "ru"
                ? "Читать PDF (FRONT) и выбрать ответы"
                : "Read PDF (FRONT) and select correct answers"}
          </CardTitle>
          <CardDescription>
            {locale === "az"
              ? "Exam seç → PDF seç → modal açılacaq → correct seç → seçilən suallar DB-yə yazılacaq"
              : locale === "ru"
                ? "Экзамен → PDF → модал → выбрать → сохранить выбранные"
                : "Exam → PDF → modal → choose → save selected"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{locale === "az" ? "Exam seç" : locale === "ru" ? "Выберите экзамен" : "Select exam"}</Label>
              <Select
                value={selectedExamId}
                onValueChange={(v) => {
                  setSelectedExamId(v)
                  resetDraftState()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Exam..." />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title} • {e.university.name} • {e.subject.name} • {e.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{locale === "az" ? "PDF seç" : locale === "ru" ? "Выберите PDF" : "Select PDF"}</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null)
                  resetDraftState()
                }}
                disabled={busy}
              />
              {file && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> {file.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={handleReadPdfFront} disabled={busy || !canReadPdfFront}>
              {busy ? (locale === "az" ? "Oxunur..." : "Reading...") : locale === "az" ? "PDF oxu (Modal aç)" : "Read PDF"}
            </Button>

            <Button variant="outline" onClick={() => setDraftModalOpen(true)} disabled={busy || draft.length === 0}>
              <Eye className="h-4 w-4 mr-2" />
              {locale === "az" ? "Draft-a bax" : "Open draft"}
            </Button>

            <div className="text-sm text-muted-foreground">
              {draft.length > 0 && (
                <>
                  {locale === "az"
                    ? `Seçilən: ${draftAnsweredCount}/${draft.length}`
                    : `Selected: ${draftAnsweredCount}/${draft.length}`}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ MODAL: Draft questions */}
      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {locale === "az" ? "PDF Draft — Doğru cavabları seç" : "PDF Draft — select correct answers"}
            </DialogTitle>
            <DialogDescription>
              {locale === "az"
                ? "İstədiyin suallara doğru cavab seç, sonra seçilənləri DB-yə yaz."
                : "Pick correct answers for any questions you want, then save selected to DB."}
            </DialogDescription>
          </DialogHeader>

          {draft.length === 0 ? (
            <div className="text-sm text-muted-foreground">{locale === "az" ? "Hələ draft yoxdur." : "No draft yet."}</div>
          ) : (
            <div className="space-y-4">
              {draft.map((q, idx) => (
                <Card key={q.tempId} className="border-muted">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {idx + 1}. {q.text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {q.options.map((opt) => {
                      const checked = selectedCorrect[q.tempId] === opt.tempOptionId
                      return (
                        <label
                          key={opt.tempOptionId}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                            checked ? "border-primary" : "border-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.tempId}
                            checked={checked}
                            onChange={() => setSelectedCorrect((prev) => ({ ...prev, [q.tempId]: opt.tempOptionId }))}
                          />
                          <span className="text-sm leading-relaxed">{opt.text}</span>
                        </label>
                      )
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {draft.length > 0 &&
                (locale === "az"
                  ? `Seçilən: ${draftAnsweredCount}/${draft.length}`
                  : `Selected: ${draftAnsweredCount}/${draft.length}`)}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDraftModalOpen(false)} disabled={busy}>
                {locale === "az" ? "Bağla" : "Close"}
              </Button>

              <Button onClick={handleCommit} disabled={busy || !canCommit}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {busy ? (locale === "az" ? "Göndərilir..." : "Sending...") : locale === "az" ? "Seçilənləri DB-yə yaz" : "Save selected"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3) Existing exams list */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "az" ? "Mövcud imtahanlar" : "Existing exams"}</CardTitle>
          <CardDescription>{locale === "az" ? "İmtahanları idarə et (edit/sil)" : "Manage exams (edit/delete)"}</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{locale === "az" ? "Heç nə yoxdur" : "No data"}</p>
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
                      {exam.questionCount} sual • {exam.price.toFixed(2)} AZN
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openManageQuestions(exam.id)} disabled={busy || qBusy}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {locale === "az" ? "Sualları idarə et" : "Manage"}
                    </Button>

                    <Button variant="destructive" onClick={() => handleDeleteExam(exam.id)} disabled={busy || qBusy}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {locale === "az" ? "Sil" : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Manage Questions Modal */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{locale === "az" ? "Sualları idarə et" : "Manage questions"}</DialogTitle>
            <DialogDescription>
              {locale === "az"
                ? "Sualı və variantları edit et, doğru cavabı seç və yadda saxla."
                : "Edit question/options, choose correct answer and save."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 pb-2">

            <Button variant="outline" onClick={() => setAddModalOpen(true)} disabled={qBusy || !manageBankId}>
              <Plus className="h-4 w-4 mr-2" />
              {locale === "az" ? "Sual əlavə et" : "Add question"}
            </Button>
          </div>

          <div className="space-y-4">
            {qBusy ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : bankQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{locale === "az" ? "Sual yoxdur" : "No questions"}</p>
            ) : (
              bankQuestions.map((q, idx) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {idx + 1}.{" "}
                      <Input
                        value={q.text}
                        onChange={(e) =>
                          setBankQuestions((prev) =>
                            prev.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)),
                          )
                        }
                      />
                    </CardTitle>
                    <CardDescription className="text-sm">{locale === "az" ? "Doğru cavabı seç:" : "Select correct:"}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    {q.options.map((opt) => {
                      const checked = (q.correctAnswerText || "").trim() === (opt.text || "").trim()
                      return (
                        <div key={opt.id} className="flex gap-2 items-start">
                          <input
                            type="radio"
                            checked={checked}
                            onChange={() => {
                              setBankQuestions((prev) =>
                                prev.map((x) => (x.id === q.id ? { ...x, correctAnswerText: opt.text } : x)),
                              )
                            }}
                          />

                          <Input
                            value={opt.text}
                            onChange={(e) => {
                              const v = e.target.value
                              setBankQuestions((prev) =>
                                prev.map((x) => {
                                  if (x.id !== q.id) return x
                                  const oldText = opt.text
                                  const newOpts = x.options.map((o) => (o.id === opt.id ? { ...o, text: v } : o))
                                  const wasCorrect = (x.correctAnswerText || "").trim() === (oldText || "").trim()
                                  return {
                                    ...x,
                                    options: newOpts,
                                    correctAnswerText: wasCorrect ? v : x.correctAnswerText,
                                  }
                                }),
                              )
                            }}
                          />
                        </div>
                      )
                    })}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => handleSaveQuestion(q)} disabled={qBusy}>
                        {locale === "az" ? "Yadda saxla" : "Save"}
                      </Button>

                      <Button variant="destructive" onClick={() => handleDeleteQuestion(q.id)} disabled={qBusy}>
                        {locale === "az" ? "Sualı sil" : "Delete question"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageModalOpen(false)} disabled={qBusy}>
              {locale === "az" ? "Bağla" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Add Question Modal (NEW) */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{locale === "az" ? "Sual əlavə et" : "Add question"}</DialogTitle>
            <DialogDescription>
              {locale === "az"
                ? "Sualı yaz, variantları doldur, doğru cavabı seç və əlavə et."
                : "Write question, fill options, pick correct and add."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{locale === "az" ? "Sual mətni" : "Question text"}</Label>
              <Input value={newQText} onChange={(e) => setNewQText(e.target.value)} placeholder="Sual..." />
            </div>

            <div className="space-y-2">
              <Label>{locale === "az" ? "Variantlar" : "Options"}</Label>
              <div className="space-y-2">
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={newCorrectIndex === i}
                      onChange={() => setNewCorrectIndex(i)}
                      title={locale === "az" ? "Doğru cavab" : "Correct"}
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const v = e.target.value
                        setNewOptions((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                      }}
                      placeholder={`${locale === "az" ? "Variant" : "Option"} ${i + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNewOptions((prev) => [...prev, ""])}
                      className="hidden"
                    >
                      +
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewOptions((prev) => [...prev, ""])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {locale === "az" ? "Variant əlavə et" : "Add option"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewOptions((prev) => {
                      if (prev.length <= 2) return prev
                      const next = prev.slice(0, -1)
                      if (newCorrectIndex >= next.length) setNewCorrectIndex(Math.max(0, next.length - 1))
                      return next
                    })
                  }}
                  disabled={newOptions.length <= 2}
                >
                  {locale === "az" ? "Son variantı sil" : "Remove last"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {locale === "az"
                ? "Qeyd: minimum 2 fərqli variant olmalıdır."
                : "Note: at least 2 unique options required."}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={resetAddState} disabled={qBusy}>
              {locale === "az" ? "Ləğv et" : "Cancel"}
            </Button>
            <Button onClick={handleAddQuestion} disabled={qBusy || !canAddQuestion}>
              {qBusy ? (locale === "az" ? "Əlavə olunur..." : "Adding...") : locale === "az" ? "Əlavə et" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
