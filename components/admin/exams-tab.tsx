"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type Exam, type University, type Subject, type DraftQuestion, type AdminQuestion } from "@/lib/api"
import { readPdfPagesSmart } from "@/lib/pdf-read"
import { parseQuestionsFromPdfPagesSmart } from "@/lib/pdf-parser"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, CheckCircle2, Eye, Trash2, Pencil, Plus, Save } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { toastError, toastSuccess } from "@/lib/toast"

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
    questionCount: "25",
    random: true,
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

  const [manageExamTitle, setManageExamTitle] = useState("")
  const [manageExamYear, setManageExamYear] = useState("")
  const [manageExamPrice, setManageExamPrice] = useState("")
  const [manageExamQuestionCount, setManageExamQuestionCount] = useState("25")
  const [manageExamUniversityName, setManageExamUniversityName] = useState("")
  const [manageExamSubjectName, setManageExamSubjectName] = useState("")
  const [manageExamRandom, setManageExamRandom] = useState<boolean>(true)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newQText, setNewQText] = useState("")
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""])
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0)

  const total = useMemo(() => (Array.isArray(draft) ? draft.length : 0), [draft])
  const [pdfProgress, setPdfProgress] = useState<number>(0)

  const draftScrollRef = useRef<HTMLDivElement | null>(null)
  const qRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    loadData()
  }, [])

  function findFirstBadTempId(list: any[]) {
    const bad = (Array.isArray(list) ? list : []).find((q) => (q?.options?.length ?? 0) !== 5)
    return bad?.tempId as string | undefined
  }

  function scrollToTempId(tempId: string) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = qRefs.current[tempId]
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    })
  }

  function scrollToQuestionNo(no: number) {
    const q = (draft as any[]).find((x, idx) => (x.qNo ?? idx + 1) === no)
    if (!q?.tempId) return
    scrollToTempId(q.tempId)
  }

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

  const totalHasAnswered = useMemo(() => {
    if (!draft.length) return 0
    return (draft as any[]).filter((q: any) => !!selectedCorrect[q.tempId]).length
  }, [draft, selectedCorrect])

  const canCreateExam = useMemo(() => {
    return !!examForm.title && !!examForm.universityId && !!examForm.subjectId && !!examForm.year && !!examForm.price && !!examForm.questionCount
  }, [examForm])

  const canReadPdfFront = useMemo(() => {
    return !!selectedExamId && !!file
  }, [selectedExamId, file])

  const canCommit = useMemo(() => {
    if (!selectedExamId || draft.length === 0) return false
    return (draft as any[]).some((q: any) => !!selectedCorrect[q.tempId])
  }, [selectedExamId, draft, selectedCorrect])

  const canAddQuestion = useMemo(() => {
    const qText = normText(newQText)
    const opts = newOptions.map(normText).filter(Boolean)
    const uniq = new Set(opts.map((x) => x.toLowerCase()))
    return qText.length > 0 && opts.length >= 2 && uniq.size >= 2 && newCorrectIndex >= 0 && newCorrectIndex < newOptions.length
  }, [newQText, newOptions, newCorrectIndex])

  const canSaveManageExam = useMemo(() => {
    const title = (manageExamTitle || "").trim()
    if (!manageBankId || !title) return false
    const y = Number(manageExamYear)
    const p = Number(manageExamPrice)
    const qc = Number(manageExamQuestionCount)
    if (!Number.isInteger(y) || y < 1900 || y > 3000) return false
    if (!Number.isFinite(p) || p < 0) return false
    if (!Number.isInteger(qc) || qc < 1) return false
    return true
  }, [manageBankId, manageExamTitle, manageExamYear, manageExamPrice, manageExamQuestionCount])

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
        questionCount: Number.parseInt(examForm.questionCount, 10) || 25,
        random: Boolean(examForm.random),
      })

      setSelectedExamId(created.id)
      setExamForm({
        title: "",
        universityId: "",
        subjectId: "",
        year: new Date().getFullYear().toString(),
        price: "5.00",
        questionCount: "25",
        random: true,
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
    if (!canReadPdfFront || !file) {
      toastError(t("exams.errors.select_exam_and_pdf"))
      return
    }

    try {
      setBusy(true)
      resetDraftState()

      setPdfProgress(0)
      const pages = await readPdfPagesSmart(file!, (pct) => setPdfProgress(pct))
      const parsed = await parseQuestionsFromPdfPagesSmart(pages)

      if (!parsed.length) throw new Error(t("exams.errors.pdf_no_questions"))

      setDraft(parsed as any)
      setSelectedCorrect({})
      setBulkPickText("")
      setDraftModalOpen(true)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const badId = findFirstBadTempId(parsed as any[])
          if (badId) scrollToTempId(badId)
          else draftScrollRef.current?.scrollTo({ top: 0, behavior: "auto" })
        })
      })

      toastSuccess(t("exams.success.pdf_parsed"))
    } catch (err: any) {
      toastError(err?.message || t("exams.errors.pdf_read_failed"))
    } finally {
      setBusy(false)
    }
  }

  function removeDraftQuestionCascade(qTempId: string) {
    delete qRefs.current[qTempId]

    setDraft((prev: any) => {
      const list = Array.isArray(prev) ? prev : []
      const next = list
        .filter((x: any) => x.tempId !== qTempId)
        .map((x: any, i: number) => ({ ...x, qNo: i + 1 }))
      return next
    })

    setSelectedCorrect((prev) => {
      if (!prev || !(qTempId in prev)) return prev
      const copy = { ...prev }
      delete copy[qTempId]
      return copy
    })
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

            const imageUrls = [
              ...(Array.isArray(q.clipUrls) ? q.clipUrls : []),
              ...((q.options || []).flatMap((o: any) => (Array.isArray(o.clipUrls) ? o.clipUrls : []))),
            ].filter(Boolean)

            return {
              text: q.text,
              options: q.options.map((o: any) => ({ text: o.text })),
              correctAnswerText: correctOpt.text,
              imageUrls,
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

      const ex = exams.find((x) => x.id === bankId)

      setManageBankId(bankId)
      setManageExamTitle(ex?.title || "")
      setManageExamYear(String(ex?.year ?? ""))
      setManageExamPrice(String(ex?.price ?? ""))
      setManageExamQuestionCount(String(ex?.questionCount ?? 25))
      setManageExamUniversityName(ex?.university?.name || "")
      setManageExamSubjectName(ex?.subject?.name || "")
      setManageExamRandom(typeof ex?.random === "boolean" ? ex.random : true)

      const res = await api.listBankQuestions(bankId)
      setBankQuestions(res.questions)

      setManageModalOpen(true)
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("exams.errors.load_questions_failed"))
    } finally {
      setQBusy(false)
    }
  }

  async function handleSaveManageExam() {
    if (!manageBankId) return

    const title = (manageExamTitle || "").trim()
    if (!title) return toastError(t("exams.errors.title_empty"))

    const yearNum = Number(manageExamYear)
    const priceNum = Number(manageExamPrice)
    const qcNum = Number(manageExamQuestionCount)
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 3000) {
      return toastError(t("exams.errors.year_invalid"))
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return toastError(t("exams.errors.price_invalid"))
    }
    if (!Number.isInteger(qcNum) || qcNum < 1) return toastError(t("exams.errors.question_count_invalid"))
    try {
      setQBusy(true)
      await api.updateExam(manageBankId, {
        title,
        year: yearNum,
        price: priceNum,
        questionCount: qcNum,
        random: Boolean(manageExamRandom),
      })
      toastSuccess(t("exams.success.exam_updated"))
      await loadData()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("exams.errors.update_failed"))
    } finally {
      setQBusy(false)
    }
  }

  function makeEmptyDraftQuestion(nextNo: number) {
    const base = Date.now()
    const tempId = `q_${base}_${Math.random().toString(16).slice(2)}`
    const mkOpt = (i: number) => ({
      tempOptionId: `o_${base}_${tempId}_${i}`,
      text: "",
      clipUrls: [],
    })

    return {
      tempId,
      qNo: nextNo,
      text: "",
      clipUrls: [],
      options: [mkOpt(0), mkOpt(1), mkOpt(2), mkOpt(3), mkOpt(4)],
    }
  }

  function addDraftQuestion(atIndex?: number) {
    setDraft((prev: any[]) => {
      const list = Array.isArray(prev) ? [...prev] : []
      const nextNo = (list[list.length - 1]?.qNo ?? list.length) + 1
      const q = makeEmptyDraftQuestion(nextNo)

      if (typeof atIndex === "number" && atIndex >= 0 && atIndex <= list.length) {
        list.splice(atIndex, 0, q)
        return list.map((x: any, idx: number) => ({ ...x, qNo: idx + 1 }))
      }

      list.push(q)
      return list.map((x: any, idx: number) => ({ ...x, qNo: idx + 1 }))
    })
  }

  function handleDeleteExam(bankId: string) {
    if (!window.confirm(t("exams.confirm.delete_exam"))) return

      ; (async () => {
        try {
          setBusy(true)
          await api.deleteBank(bankId)
          toastSuccess(t("exams.success.deleted"))
          await loadData()
          if (manageBankId === bankId) setManageModalOpen(false)
        } catch (err) {
          toastError(err instanceof Error ? err.message : t("exams.errors.delete_failed"))
        } finally {
          setBusy(false)
        }
      })()
  }

  function handleDeleteQuestion(questionId: string) {
    if (!window.confirm(t("exams.confirm.delete_question"))) return

      ; (async () => {
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
      })()
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
    if (!API_URL) return toastError(t("exams.errors.api_url_missing"))
    if (!manageBankId) return toastError(t("exams.errors.bank_not_selected"))
    if (!canAddQuestion) return toastError(t("exams.errors.add_question_invalid"))

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
    if (!correctText) return toastError(t("exams.errors.select_correct"))

    const correctIn = finalOpts.find((x) => x.toLowerCase() === correctText.toLowerCase())
    if (!correctIn) return toastError(t("exams.errors.correct_not_in_options"))

    try {
      setQBusy(true)

      const headers: Record<string, string> = { "Content-Type": "application/json" }
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
        return { ...q, options: q.options.map((o: any) => (o.tempOptionId === optTempId ? { ...o, text } : o)) }
      }),
    )
  }

  function addDraftOption(qTempId: string) {
    setDraft((prev: any) =>
      prev.map((q: any) => {
        if (q.tempId !== qTempId) return q
        const nextIndex = q.options.length
        const idBase = Date.now()
        return { ...q, options: [...q.options, { tempOptionId: `o_${idBase}_${qTempId}_${nextIndex}`, text: "" }] }
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
    if (!draft.length) return toastError(t("exams.errors.no_draft"))

    const picks = parseBulkPicks(bulkPickText)
    if (!picks.length) return toastError(t("exams.errors.bulk_invalid"))

    const letterToIdx = (l: string) => l.charCodeAt(0) - 65

    setSelectedCorrect((prev) => {
      const next = { ...prev }
      for (const { qIndex, letter } of picks) {
        const i = qIndex - 1
        if (i < 0 || i >= draft.length) continue
        const q = (draft as any[])[i] as any
        const optIdx = letterToIdx(letter)
        if (optIdx < 0 || optIdx >= q.options.length) continue
        next[q.tempId] = q.options[optIdx].tempOptionId
      }
      return next
    })

    toastSuccess(t("exams.success.bulk_applied"))
  }

  const missing5VariantNumbers = useMemo(() => {
    if (!Array.isArray(draft) || draft.length === 0) return []
    return (draft as any[])
      .map((q, idx) => {
        const count = Array.isArray(q.options) ? q.options.length : 0
        const no = q.qNo ?? idx + 1
        return count === 5 ? null : no
      })
      .filter((x): x is number => x !== null)
  }, [draft])

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
              <Input type="number" value={examForm.year} onChange={(e) => setExamForm({ ...examForm, year: e.target.value })} disabled={busy} />
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
              <Input type="number" step="0.01" value={examForm.price} onChange={(e) => setExamForm({ ...examForm, price: e.target.value })} disabled={busy} />
            </div>

            <div className="space-y-2">
              <Label>{t("exams.ui.question_count")}</Label>
              <Input
                type="number"
                min={1}
                value={examForm.questionCount}
                onChange={(e) => setExamForm({ ...examForm, questionCount: e.target.value })}
                disabled={busy}
                placeholder="25"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("exams.ui.random_mode")}</Label>
              <Select
                value={examForm.random ? "true" : "false"}
                onValueChange={(v) => setExamForm({ ...examForm, random: v === "true" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">🎲 {t("exams.ui.random")}</SelectItem>
                  <SelectItem value="false">📄 {t("exams.ui.sequential")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <Button onClick={handleCreateExam} disabled={busy || !canCreateExam} type="button">
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

          <div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button onClick={handleReadPdfFront} disabled={busy || !canReadPdfFront} type="button">
                {busy ? t("exams.ui.reading") : t("exams.ui.read_pdf_open_modal")}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setDraftModalOpen(true)
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      const badId = findFirstBadTempId(draft as any[])
                      if (badId) scrollToTempId(badId)
                    })
                  })
                }}
                disabled={busy || draft.length === 0}
                type="button"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("exams.ui.open_draft")}
              </Button>

              <div className="text-sm text-muted-foreground">
                {draft.length > 0 && <>{t("exams.ui.selected_count", { selected: totalHasAnswered, total: draft.length })}</>}
              </div>
            </div>

            {busy && pdfProgress > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("exams.ui.pdf_loading")}</span>
                  <span>{pdfProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary origin-left"
                    style={{
                      transform: `scaleX(${pdfProgress / 100})`,
                      transition: "transform 80ms linear",
                      willChange: "transform",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent
          ref={draftScrollRef as any}
          className="!w-[98vw] !h-[96vh] max-w-none max-h-none overflow-y-auto rounded-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("exams.ui.draft_modal_title")}</DialogTitle>
            <DialogDescription>{t("exams.ui.draft_modal_desc")}</DialogDescription>
          </DialogHeader>

          {total === 0 ? (
            <div className="text-sm text-muted-foreground">{t("exams.ui.no_draft_yet")}</div>
          ) : (
            <div className="space-y-4">
              {(draft as any[]).map((q, idx) => {
                const no = q.qNo ?? idx + 1
                return (
                  <div
                    key={q.tempId}
                    id={`draft-q-${no}`}
                    ref={(el) => {
                      qRefs.current[q.tempId] = el
                    }}
                    className="scroll-mt-24"
                  >
                    <Card className="border-muted">
                      <CardHeader className="flex flex-row items-center justify-between gap-2">
                        <CardTitle className="text-base">{no}.</CardTitle>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addDraftQuestion(idx + 1)}
                            disabled={busy}
                            title={t("exams.ui.add_question_after_this")}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t("exams.ui.add_after")}
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const ok = window.confirm(t("exams.confirm.delete_draft_question"))
                              if (ok) removeDraftQuestionCascade(q.tempId)
                            }}
                            disabled={busy}
                            title={t("exams.ui.delete_question")}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("common.delete")}
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {Array.isArray(q.clipUrls) && q.clipUrls.length > 0 && (
                          <div className="space-y-2">
                            <Label>{t("exams.ui.figures")}</Label>
                            <div className="grid gap-3 md:grid-cols-2">
                              {q.clipUrls.map((u: string, i: number) => (
                                <img key={i} src={u} alt={`q-figure-${i}`} className="w-full rounded-lg border bg-white" />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>{t("exams.ui.question_text")}</Label>
                          <textarea
                            className="w-full min-h-[90px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={q.text || ""}
                            onChange={(e) => updateDraftQuestion(q.tempId, { text: e.target.value })}
                            placeholder={t("exams.ui.question_placeholder")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t("exams.ui.options")}</Label>

                          {(!Array.isArray(q.options) || q.options.length === 0) && (
                            <div className="text-sm text-muted-foreground">
                              {t("exams.ui.no_options_found")}
                            </div>
                          )}

                          <div className="space-y-2">
                            {(q.options || []).map((opt: any, oi: number) => {
                              const checked = selectedCorrect[q.tempId] === opt.tempOptionId
                              return (
                                <div key={opt.tempOptionId} className="flex flex-col gap-2 rounded-lg border p-3">
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="radio"
                                      name={q.tempId}
                                      checked={checked}
                                      onChange={() => setSelectedCorrect((prev) => ({ ...prev, [q.tempId]: opt.tempOptionId }))}
                                      className="mt-2"
                                      title={t("exams.ui.correct_answer")}
                                    />

                                    <div className="flex-1 space-y-2">
                                      <Input
                                        value={opt.text || ""}
                                        onChange={(e) => updateDraftOption(q.tempId, opt.tempOptionId, e.target.value)}
                                        placeholder={`${String.fromCharCode(65 + oi)}) ${t("exams.ui.option_n", { n: oi + 1 })}`}
                                      />

                                      {Array.isArray(opt.clipUrls) && opt.clipUrls.length > 0 && (
                                        <div className="grid gap-2 md:grid-cols-2">
                                          {opt.clipUrls.map((u: string, i: number) => (
                                            <img key={i} src={u} alt={`opt-figure-${oi}-${i}`} className="w-full rounded-lg border bg-white" />
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => removeDraftOption(q.tempId, opt.tempOptionId)}
                                      disabled={(q.options || []).length <= 2}
                                      title={t("exams.ui.remove_option")}
                                    >
                                      {t("common.delete")}
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="flex gap-2 pt-2 items-center">
                            <Button type="button" variant="outline" onClick={() => addDraftOption(q.tempId)}>
                              <Plus className="h-4 w-4 mr-2" />
                              {t("exams.ui.add_option")}
                            </Button>

                            <div className="text-xs text-muted-foreground">{t("exams.ui.note_min_2_unique")}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 border-t pt-4 space-y-2">
            <Label>{t("exams.ui.bulk_pick_label")}</Label>
            <div className="flex gap-2">
              <Input value={bulkPickText} onChange={(e) => setBulkPickText(e.target.value)} placeholder={t("exams.ui.bulk_pick_placeholder")} />
              <Button type="button" variant="outline" onClick={applyBulkPicks} disabled={busy || total === 0}>
                {t("exams.ui.apply")}
              </Button>
            </div>

            {total > 0 && missing5VariantNumbers.length > 0 && (
              <div className="text-sm text-destructive">
                {t("exams.ui.questions_without_5_variants")}:
                <span className="flex flex-wrap gap-2 mt-1">
                  {missing5VariantNumbers.map((no) => (
                    <button key={no} type="button" className="underline underline-offset-2 hover:opacity-80" onClick={() => scrollToQuestionNo(no)} title={t("exams.ui.jump_to_question", { no })}>
                      {no}
                    </button>
                  ))}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {total > 0 && <>{t("exams.ui.selected_count", { selected: totalHasAnswered, total })}</>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDraftModalOpen(false)} disabled={busy} type="button">
                {t("common.close")}
              </Button>

              <Button onClick={handleCommit} disabled={busy || !canCommit} type="button">
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
                      {exam.university.name} • {exam.subject.name} • {exam.year} • <span className="text-sm font-medium">
                        {exam.random ? t("exams.ui.random") : t("exams.ui.sequential")}
                      </span>

                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("exams.ui.question_count_price", { count: exam.questionCount, price: exam.price.toFixed(2) })}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button variant="outline" onClick={() => openManageQuestions(exam.id)} disabled={busy || qBusy} type="button">
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("exams.ui.manage_questions")}
                    </Button>

                    <Button variant="destructive" onClick={() => handleDeleteExam(exam.id)} disabled={busy || qBusy} type="button">
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

      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="!w-[98vw] !h-[96vh] max-w-none max-h-none overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("exams.ui.manage_modal_title")}</DialogTitle>
            <DialogDescription>{t("exams.ui.manage_modal_desc")}</DialogDescription>
          </DialogHeader>

          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-base">{t("exams.ui.edit_exam_modal_title")}</CardTitle>
              <CardDescription className="text-sm">
                {(manageExamUniversityName || manageExamSubjectName) && (
                  <>
                    {manageExamUniversityName} • {manageExamSubjectName}
                  </>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label>{t("exams.ui.exam_title_label")}</Label>
                  <Input value={manageExamTitle} onChange={(e) => setManageExamTitle(e.target.value)} disabled={qBusy} />
                </div>

                <div className="space-y-2">
                  <Label>{t("common.year")}</Label>
                  <Input type="number" value={manageExamYear} onChange={(e) => setManageExamYear(e.target.value)} disabled={qBusy} />
                </div>

                <div className="space-y-2">
                  <Label>{t("exams.ui.price_label")} (AZN)</Label>
                  <Input type="number" step="0.01" value={manageExamPrice} onChange={(e) => setManageExamPrice(e.target.value)} disabled={qBusy} />
                </div>
                <div className="space-y-2">
                  <Label>{t("exams.ui.question_count")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={manageExamQuestionCount}
                    onChange={(e) => setManageExamQuestionCount(e.target.value)}
                    disabled={qBusy}
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("exams.ui.random_mode")}</Label>
                <Select
                  value={manageExamRandom ? "true" : "false"}
                  onValueChange={(v) => setManageExamRandom(v === "true")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">🎲 {t("exams.ui.random")}</SelectItem>
                    <SelectItem value="false">📄 {t("exams.ui.sequential")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleSaveManageExam} disabled={qBusy || !canSaveManageExam} type="button">
                  <Save className="h-4 w-4 mr-2" />
                  {qBusy ? t("exams.ui.saving") : t("common.save")}
                </Button>

                <Button variant="destructive" onClick={() => handleDeleteExam(manageBankId)} disabled={qBusy || !manageBankId} type="button">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("common.delete")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-2 pt-3 pb-2">
            <Button variant="outline" onClick={() => setAddModalOpen(true)} disabled={qBusy || !manageBankId} type="button">
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
                      <Input value={q.text} onChange={(e) => setBankQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)))} />
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
                            onChange={() => setBankQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, correctAnswerText: opt.text } : x)))}
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
                                  return { ...x, options: newOpts, correctAnswerText: wasCorrect ? v : x.correctAnswerText }
                                }),
                              )
                            }}
                          />
                        </div>
                      )
                    })}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => handleSaveQuestion(q)} disabled={qBusy} type="button">
                        {t("common.save")}
                      </Button>

                      <Button variant="destructive" onClick={() => handleDeleteQuestion(q.id)} disabled={qBusy} type="button">
                        {t("exams.ui.delete_question")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageModalOpen(false)} disabled={qBusy} type="button">
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
                    <Input value={opt} onChange={(e) => setNewOptions((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))} placeholder={t("exams.ui.option_n", { n: i + 1 })} />
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
            <Button variant="outline" onClick={resetAddState} disabled={qBusy} type="button">
              {t("common.cancel")}
            </Button>

            <Button onClick={handleAddQuestion} disabled={qBusy || !canAddQuestion} type="button">
              {qBusy ? t("exams.ui.adding") : t("exams.ui.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}