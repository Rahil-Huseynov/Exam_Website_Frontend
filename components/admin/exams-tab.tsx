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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, CheckCircle2, Eye, Trash2, Pencil, Plus } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { toastConfirm, toastError, toastSuccess } from "@/lib/toast"

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

  const [bulkPickText, setBulkPickText] = useState("")

  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [manageBankId, setManageBankId] = useState<string>("")
  const [bankQuestions, setBankQuestions] = useState<AdminQuestion[]>([])
  const [qBusy, setQBusy] = useState(false)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newQText, setNewQText] = useState("")
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""])
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0)

  const [editExamOpen, setEditExamOpen] = useState(false)
  const [editExamId, setEditExamId] = useState<string>("")
  const [editTitle, setEditTitle] = useState("")
  const [editYear, setEditYear] = useState("")
  const [editPrice, setEditPrice] = useState("")

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
      toastError(err instanceof Error ? err.message : t("exams.errors.load_data_failed"))
    } finally {
      setLoading(false)
    }
  }

  function resetDraftState() {
    setDraft([])
    setSelectedCorrect({})
    setBulkPickText("")
    setDraftModalOpen(false)
  }

  function resetAddState() {
    setNewQText("")
    setNewOptions(["", "", "", ""])
    setNewCorrectIndex(0)
    setAddModalOpen(false)
  }

  function openEditExam(exam: Exam) {
    setEditExamId(exam.id)
    setEditTitle(exam.title || "")
    setEditYear(String(exam.year ?? ""))
    setEditPrice(String(exam.price ?? ""))
    setEditExamOpen(true)
  }

  async function handleSaveExamEdit() {
    if (!editExamId) return

    const title = (editTitle || "").trim()
    if (!title) {
      toastError(t("exams.errors.title_empty"))
      return
    }

    const yearNum = Number(editYear)
    const priceNum = Number(editPrice)

    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 3000) {
      toastError(t("exams.errors.year_invalid"))
      return
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toastError(t("exams.errors.price_invalid"))
      return
    }

    try {
      setBusy(true)
      await api.updateExam(editExamId, { title, year: yearNum, price: priceNum })
      toastSuccess(t("exams.success.exam_updated"))
      setEditExamOpen(false)
      await loadData()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("exams.errors.update_failed"))
    } finally {
      setBusy(false)
    }
  }

  const canCreateExam = useMemo(() => {
    return !!examForm.title && !!examForm.universityId && !!examForm.subjectId && !!examForm.year && !!examForm.price
  }, [examForm])

  const canReadPdfFront = useMemo(() => {
    return !!selectedExamId && !!file
  }, [selectedExamId, file])

  const canCommit = useMemo(() => {
    if (!selectedExamId || draft.length === 0) return false
    return draft.some((q: any) => !!selectedCorrect[q.tempId])
  }, [selectedExamId, draft, selectedCorrect])

  const draftAnsweredCount = useMemo(() => {
    if (!draft.length) return 0
    return draft.filter((q: any) => !!selectedCorrect[q.tempId]).length
  }, [draft, selectedCorrect])

  const canAddQuestion = useMemo(() => {
    const qText = normText(newQText)
    const opts = newOptions.map(normText).filter(Boolean)
    const uniq = new Set(opts.map((x) => x.toLowerCase()))
    return qText.length > 0 && opts.length >= 2 && uniq.size >= 2 && newCorrectIndex >= 0 && newCorrectIndex < newOptions.length
  }, [newQText, newOptions, newCorrectIndex])

  async function handleCreateExam() {
    if (!canCreateExam) {
      toastError(t("exams.errors.fill_all_fields"))
      return
    }

    try {
      setBusy(true)

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

      toastSuccess(t("exams.success.exam_created"))
      await loadData()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("exams.errors.create_failed"))
    } finally {
      setBusy(false)
    }
  }

  async function handleReadPdfFront() {
    if (!canReadPdfFront) {
      toastError(t("exams.errors.select_exam_and_pdf"))
      return
    }

    try {
      setBusy(true)
      resetDraftState()

      const text = await readPdfText(file!)
      const parsed = parseQuestionsFromText(text)

      if (!parsed.length) {
        throw new Error(t("exams.errors.pdf_no_questions"))
      }

      setDraft(parsed as any)
      setSelectedCorrect({})
      setBulkPickText("")
      setDraftModalOpen(true)
      toastSuccess(t("exams.success.pdf_parsed"))
    } catch (err: any) {
      toastError(err?.message || t("exams.errors.pdf_read_failed"))
    } finally {
      setBusy(false)
    }
  }

  async function handleCommit() {
    if (!canCommit) {
      toastError(t("exams.errors.select_at_least_one"))
      return
    }

    try {
      setBusy(true)

      const payload = {
        questions: (draft as any[])
          .filter((q) => !!selectedCorrect[q.tempId])
          .map((q) => {
            const correctTempId = selectedCorrect[q.tempId]
            const correctOpt = q.options.find((o: any) => o.tempOptionId === correctTempId)
            if (!correctOpt) throw new Error(t("exams.errors.correct_option_missing"))

            return {
              text: q.text,
              options: q.options.map((o: any) => ({ text: o.text })),
              correctAnswerText: correctOpt.text,
            }
          }),
      }

      await api.importQuestionsDirect(selectedExamId, payload)

      toastSuccess(t("exams.success.saved_to_db"))
      resetDraftState()
      setFile(null)

      await loadData()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("exams.errors.commit_failed"))
    } finally {
      setBusy(false)
    }
  }

  async function openManageQuestions(bankId: string) {
    try {
      setQBusy(true)
      setManageBankId(bankId)

      const res = await api.listBankQuestions(bankId)
      setBankQuestions(res.questions)

      setManageModalOpen(true)
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("exams.errors.load_questions_failed"))
    } finally {
      setQBusy(false)
    }
  }

  function handleDeleteExam(bankId: string) {
    toastConfirm(t("exams.confirm.delete_exam"), async () => {
      try {
        setBusy(true)
        await api.deleteBank(bankId)
        toastSuccess(t("exams.success.deleted"))
        await loadData()
      } catch (err) {
        toastError(err instanceof Error ? err.message : t("exams.errors.delete_failed"))
      } finally {
        setBusy(false)
      }
    })
  }

  function handleDeleteQuestion(questionId: string) {
    toastConfirm(t("exams.confirm.delete_question"), async () => {
      try {
        setQBusy(true)
        await api.deleteQuestion(questionId)
        setBankQuestions((prev) => prev.filter((x) => x.id !== questionId))
        toastSuccess(t("exams.success.question_deleted"))
        await loadData()
      } catch (err) {
        toastError(err instanceof Error ? err.message : t("exams.errors.delete_failed"))
      } finally {
        setQBusy(false)
      }
    })
  }

  async function handleSaveQuestion(q: AdminQuestion) {
    try {
      setQBusy(true)

      const payload = {
        text: q.text,
        options: q.options.map((o) => ({ text: o.text })),
        correctAnswerText: q.correctAnswerText || "",
      }

      const updated = await api.updateQuestion(q.id, payload)
      setBankQuestions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      toastSuccess(t("exams.success.saved"))
      await loadData()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("exams.errors.save_failed"))
    } finally {
      setQBusy(false)
    }
  }

  async function handleAddQuestion() {
    if (!API_URL) {
      toastError(t("exams.errors.api_url_missing"))
      return
    }
    if (!manageBankId) {
      toastError(t("exams.errors.bank_not_selected"))
      return
    }
    if (!canAddQuestion) {
      toastError(t("exams.errors.add_question_invalid"))
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
      toastError(t("exams.errors.select_correct"))
      return
    }

    const correctIn = finalOpts.find((x) => x.toLowerCase() === correctText.toLowerCase())
    if (!correctIn) {
      toastError(t("exams.errors.correct_not_in_options"))
      return
    }

    try {
      setQBusy(true)

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
        const msg = await res.text().catch(() => t("exams.errors.add_failed"))
        throw new Error(msg || t("exams.errors.add_failed"))
      }

      const created = (await res.json()) as AdminQuestion

      setBankQuestions((prev) => [created, ...prev])
      toastSuccess(t("exams.success.question_added"))
      resetAddState()
      await loadData()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("exams.errors.add_failed"))
    } finally {
      setQBusy(false)
    }
  }
  function updateDraftQuestion(tempId: string, patch: Partial<any>) {
    setDraft((prev: any) => prev.map((q: any) => (q.tempId === tempId ? { ...q, ...patch } : q)))
  }

  function updateDraftOption(qTempId: string, optTempId: string, text: string) {
    setDraft((prev: any) =>
      prev.map((q: any) => {
        if (q.tempId !== qTempId) return q
        return {
          ...q,
          options: q.options.map((o: any) => (o.tempOptionId === optTempId ? { ...o, text } : o)),
        }
      }),
    )
  }

  function addDraftOption(qTempId: string) {
    setDraft((prev: any) =>
      prev.map((q: any) => {
        if (q.tempId !== qTempId) return q
        const nextIndex = q.options.length
        const idBase = Date.now()
        return {
          ...q,
          options: [...q.options, { tempOptionId: `o_${idBase}_${qTempId}_${nextIndex}`, text: "" }],
        }
      }),
    )
  }

  function removeDraftOption(qTempId: string, optTempId: string) {
    setDraft((prev: any) =>
      prev.map((q: any) => {
        if (q.tempId !== qTempId) return q
        const nextOpts = q.options.filter((o: any) => o.tempOptionId !== optTempId)
        return { ...q, options: nextOpts }
      }),
    )

    setSelectedCorrect((prev) => {
      if (prev[qTempId] !== optTempId) return prev
      const copy = { ...prev }
      delete copy[qTempId]
      return copy
    })
  }

  function parseBulkPicks(input: string) {
    const txt = (input || "").trim()
    if (!txt) return []

    const parts = txt
      .replace(/\n/g, " ")
      .split(/[,;]+|\s{2,}/g)
      .map((x) => x.trim())
      .filter(Boolean)

    const out: Array<{ qIndex: number; letter: string }> = []
    for (const p of parts) {
      const m = p.match(/^(\d{1,4})\s*[-=:. ]\s*([a-eA-E])$/)
      if (!m) continue
      out.push({ qIndex: Number(m[1]), letter: String(m[2]).toUpperCase() })
    }
    return out
  }

  function applyBulkPicks() {
    if (!draft.length) return toastError(t("exams.errors.no_draft") || "Draft boşdur")

    const picks = parseBulkPicks(bulkPickText)
    if (!picks.length) {
      return toastError(t("exams.errors.bulk_invalid") || "Format düzgün deyil. Məs: 1-a, 2-b, 3-c")
    }

    const letterToIdx = (l: string) => l.charCodeAt(0) - 65 

    setSelectedCorrect((prev) => {
      const next = { ...prev }

      for (const { qIndex, letter } of picks) {
        const i = qIndex - 1
        if (i < 0 || i >= draft.length) continue

        const q = draft[i] as any
        const optIdx = letterToIdx(letter)
        if (optIdx < 0 || optIdx >= q.options.length) continue

        next[q.tempId] = q.options[optIdx].tempOptionId
      }

      return next
    })

    toastSuccess(t("exams.success.bulk_applied") || "Seçimlər tətbiq olundu")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("exams.ui.create_exam_title")}</CardTitle>
          <CardDescription>{t("exams.ui.create_exam_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("common.title")}</Label>
              <Input
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                disabled={busy}
                placeholder={t("exams.ui.title_placeholder")}
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
            {busy ? t("processing") : t("common.create")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("exams.ui.pdf_title")}</CardTitle>
          <CardDescription>{t("exams.ui.pdf_desc")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("exams.ui.select_exam")}</Label>
              <Select
                value={selectedExamId}
                onValueChange={(v) => {
                  setSelectedExamId(v)
                  resetDraftState()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("exams.ui.exam_placeholder")} />
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
              <Label>{t("exams.ui.select_pdf")}</Label>
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
              {busy ? t("exams.ui.reading") : t("exams.ui.read_pdf_open_modal")}
            </Button>

            <Button variant="outline" onClick={() => setDraftModalOpen(true)} disabled={busy || draft.length === 0}>
              <Eye className="h-4 w-4 mr-2" />
              {t("exams.ui.open_draft")}
            </Button>

            <div className="text-sm text-muted-foreground">
              {draft.length > 0 && <>{t("exams.ui.selected_count", { selected: draftAnsweredCount, total: draft.length })}</>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==========================
          DRAFT MODAL (EDITABLE)
         ========================== */}
      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent className="!w-[98vw] !h-[96vh] max-w-none max-h-none overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("exams.ui.draft_modal_title")}</DialogTitle>
            <DialogDescription>{t("exams.ui.draft_modal_desc")}</DialogDescription>
          </DialogHeader>

          {(draft as any[]).length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("exams.ui.no_draft_yet")}</div>
          ) : (
            <div className="space-y-4">
              {(draft as any[]).map((q, idx) => (
                <Card key={q.tempId} className="border-muted">
                  <CardHeader>
                    <CardTitle className="text-base">{idx + 1}.</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Question editable */}
                    <div className="space-y-2">
                      <Label>{t("exams.ui.question_text") || "Sual"}</Label>
                      <textarea
                        className="w-full min-h-[90px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={q.text}
                        onChange={(e) => updateDraftQuestion(q.tempId, { text: e.target.value })}
                        placeholder={t("exams.ui.question_placeholder") || "Sual mətnini yaz..."}
                      />
                    </div>

                    {/* Options editable + correct radio */}
                    <div className="space-y-2">
                      <Label>{t("exams.ui.options") || "Variantlar"}</Label>

                      <div className="space-y-2">
                        {q.options.map((opt: any, oi: number) => {
                          const checked = selectedCorrect[q.tempId] === opt.tempOptionId
                          return (
                            <div key={opt.tempOptionId} className="flex items-start gap-2">
                              <input
                                type="radio"
                                name={q.tempId}
                                checked={checked}
                                onChange={() => setSelectedCorrect((prev) => ({ ...prev, [q.tempId]: opt.tempOptionId }))}
                                className="mt-2"
                                title={t("exams.ui.correct_answer") || "Düzgün cavab"}
                              />

                              <Input
                                value={opt.text}
                                onChange={(e) => updateDraftOption(q.tempId, opt.tempOptionId, e.target.value)}
                                placeholder={`${String.fromCharCode(65 + oi)}) ${t("exams.ui.option_n", { n: oi + 1 }) || "Variant"}`}
                              />

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => removeDraftOption(q.tempId, opt.tempOptionId)}
                                disabled={q.options.length <= 2}
                                title={t("exams.ui.remove_last_option") || "Sil"}
                              >
                                {t("common.delete") || "Sil"}
                              </Button>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex gap-2 pt-2 items-center">
                        <Button type="button" variant="outline" onClick={() => addDraftOption(q.tempId)}>
                          <Plus className="h-4 w-4 mr-2" />
                          {t("exams.ui.add_option") || "Variant əlavə et"}
                        </Button>

                        <div className="text-xs text-muted-foreground">
                          {t("exams.ui.note_min_2_unique") || "Minimum 2 fərqli variant saxla."}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ✅ NEW: Bulk picker at the bottom */}
          <div className="mt-4 border-t pt-4 space-y-2">
            <Label>{t("exams.ui.bulk_pick_label") || "Toplu düzgün cavab seçimi (məs: 1-a, 2-b, 3-c)"}</Label>
            <div className="flex gap-2">
              <Input
                value={bulkPickText}
                onChange={(e) => setBulkPickText(e.target.value)}
                placeholder={t("exams.ui.bulk_pick_placeholder") || "1-a, 2-b, 3-c"}
              />
              <Button type="button" variant="outline" onClick={applyBulkPicks} disabled={busy || draft.length === 0}>
                {t("exams.ui.apply") || "Apply"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("exams.ui.bulk_pick_help") || "Dəstək: 1-a, 2-b, 3-c | 1=a | 1:a | 1 a"}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {(draft as any[]).length > 0 && <>{t("exams.ui.selected_count", { selected: draftAnsweredCount, total: (draft as any[]).length })}</>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDraftModalOpen(false)} disabled={busy}>
                {t("common.close")}
              </Button>

              <Button onClick={handleCommit} disabled={busy || !canCommit}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {busy ? t("exams.ui.sending") : t("exams.ui.save_selected")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t("exams.ui.existing_title")}</CardTitle>
          <CardDescription>{t("exams.ui.existing_desc")}</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("exams.ui.no_data")}</p>
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
                      {t("exams.ui.question_count_price", {
                        count: exam.questionCount,
                        price: exam.price.toFixed(2),
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button variant="outline" onClick={() => openEditExam(exam)} disabled={busy || qBusy}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("exams.ui.edit_exam")}
                    </Button>

                    <Button variant="outline" onClick={() => openManageQuestions(exam.id)} disabled={busy || qBusy}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("exams.ui.manage_questions")}
                    </Button>

                    <Button variant="destructive" onClick={() => handleDeleteExam(exam.id)} disabled={busy || qBusy}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("common.delete")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editExamOpen} onOpenChange={setEditExamOpen}>
        <DialogContent className="!w-[98vw] !h-[96vh] max-w-none max-h-none overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("exams.ui.edit_exam_modal_title")}</DialogTitle>
            <DialogDescription>{t("exams.ui.edit_exam_modal_desc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("exams.ui.exam_title_label")}</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} disabled={busy} />
            </div>

            <div className="space-y-2">
              <Label>{t("common.year")}</Label>
              <Input type="number" value={editYear} onChange={(e) => setEditYear(e.target.value)} disabled={busy} />
            </div>

            <div className="space-y-2">
              <Label>{t("exams.ui.price_label")} (AZN)</Label>
              <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} disabled={busy} />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditExamOpen(false)} disabled={busy}>
              {t("common.close")}
            </Button>

            <Button onClick={handleSaveExamEdit} disabled={busy}>
              {busy ? t("exams.ui.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="!w-[98vw] !h-[96vh] max-w-none max-h-none overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("exams.ui.manage_modal_title")}</DialogTitle>
            <DialogDescription>{t("exams.ui.manage_modal_desc")}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 pb-2">
            <Button variant="outline" onClick={() => setAddModalOpen(true)} disabled={qBusy || !manageBankId}>
              <Plus className="h-4 w-4 mr-2" />
              {t("exams.ui.add_question")}
            </Button>
          </div>

          <div className="space-y-4">
            {qBusy ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : bankQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("exams.ui.no_questions")}</p>
            ) : (
              bankQuestions.map((q, idx) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {idx + 1}.{" "}
                      <Input
                        value={q.text}
                        onChange={(e) =>
                          setBankQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)))
                        }
                      />
                    </CardTitle>
                    <CardDescription className="text-sm">{t("exams.ui.select_correct")}</CardDescription>
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
                              setBankQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, correctAnswerText: opt.text } : x)))
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
                        {t("common.save")}
                      </Button>

                      <Button variant="destructive" onClick={() => handleDeleteQuestion(q.id)} disabled={qBusy}>
                        {t("exams.ui.delete_question")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageModalOpen(false)} disabled={qBusy}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="!w-[98vw] !h-[96vh] max-w-none max-h-none overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("exams.ui.add_question_modal_title")}</DialogTitle>
            <DialogDescription>{t("exams.ui.add_question_modal_desc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("exams.ui.question_text")}</Label>
              <Input value={newQText} onChange={(e) => setNewQText(e.target.value)} placeholder={t("exams.ui.question_placeholder")} />
            </div>

            <div className="space-y-2">
              <Label>{t("exams.ui.options")}</Label>
              <div className="space-y-2">
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" checked={newCorrectIndex === i} onChange={() => setNewCorrectIndex(i)} title={t("exams.ui.correct_answer")} />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const v = e.target.value
                        setNewOptions((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                      }}
                      placeholder={t("exams.ui.option_n", { n: i + 1 })}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setNewOptions((prev) => [...prev, ""])}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("exams.ui.add_option")}
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
                  {t("exams.ui.remove_last_option")}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">{t("exams.ui.note_min_2_unique")}</div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={resetAddState} disabled={qBusy}>
              {t("common.cancel")}
            </Button>

            <Button onClick={handleAddQuestion} disabled={qBusy || !canAddQuestion}>
              {qBusy ? t("exams.ui.adding") : t("exams.ui.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
