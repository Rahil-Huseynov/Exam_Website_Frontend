"use client"

import { useMemo, useState } from "react"
import { api } from "@/lib/api"
import { readPdfPagesSmart } from "@/lib/pdf-read"
import { mergePagesForParsing, parseQuestionsFromText, type DraftQuestion, analyzePdfText } from "@/lib/pdf-parser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

type Props = { bankId: string }

export default function PdfImportFrontModal({ bankId }: Props) {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DraftQuestion[]>([])
  const [selectedCorrect, setSelectedCorrect] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState("")

  const selectedCount = useMemo(() => draft.filter((q) => !!selectedCorrect[q.tempId]).length, [draft, selectedCorrect])
  const canSave = useMemo(() => draft.length > 0 && draft.every((q) => !!selectedCorrect[q.tempId]), [draft, selectedCorrect])

  async function handlePickPdf(file: File) {
    setError("")
    setDebugInfo("")
    setLoading(true)

    try {
      const pages = await readPdfPagesSmart(file)

      let debug = t("pdfImport.debug.pdf_pages", { count: pages.length }) + "\n"
      pages.forEach((p) => {
        const lines = p.text.split("\n")
        debug += t("pdfImport.debug.page_lines_first", {
          page: p.page,
          lines: lines.length,
          first: (lines[0] || "").substring(0, 50),
        })
        debug += "\n"
      })

      const merged = mergePagesForParsing(pages.map((p) => ({ page: p.page, text: p.text })))
      const pageImageMap: Record<number, string> = Object.fromEntries(pages.map((p) => [p.page, p.imageUrl]))

      setDebugInfo(debug)

      console.log("Analyzing PDF text...")
      analyzePdfText(merged)

      const parsed = parseQuestionsFromText(merged, pageImageMap)

      console.log(`Parsed ${parsed.length} questions`)
      if (parsed.length > 0) {
        console.log("First question:", parsed[0])
      }

      if (!parsed.length) {
        const sampleText = merged.substring(0, 1000)
        setDebugInfo((prev) => prev + `\n\n${t("pdfImport.debug.sample_text")}\n${sampleText}`)
        throw new Error(t("pdfImport.errors.no_questions_read", { pages: pages.length }))
      }

      setDraft(parsed)
      setSelectedCorrect({})
      setOpen(true)
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : t("pdfImport.errors.read_failed")
      setError(errMsg)
      console.error("PDF import error:", e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendToBackend() {
    setError("")
    if (!canSave) {
      setError(t("pdfImport.errors.select_all_correct"))
      return
    }

    setSaving(true)
    try {
      const payload = {
        questions: draft.map((q) => {
          const correctTemp = selectedCorrect[q.tempId]
          const correctOpt = q.options.find((o) => o.tempOptionId === correctTemp)
          if (!correctOpt) throw new Error(t("pdfImport.errors.correct_option_not_found"))

          return {
            text: q.text,
            options: q.options.map((opt) => ({ text: opt.text })),
            correctAnswerText: correctOpt.text,
            imageUrl: q.imageUrl,
          }
        }),
      }

      await api.importQuestionsDirect(bankId, payload)

      setOpen(false)
      setDraft([])
      setSelectedCorrect({})
      setDebugInfo("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("pdfImport.errors.send_failed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <Input
        type="file"
        accept=".pdf"
        disabled={loading || saving}
        onChange={async (e) => {
          const file = e.target.files?.[0] || null
          if (file) await handlePickPdf(file)
        }}
      />

      {loading && <div className="text-sm text-muted-foreground">{t("pdfImport.ui.reading")}</div>}

      {error && (
        <div className="text-sm text-red-600 font-semibold">
          {error}
          {debugInfo && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap overflow-auto max-h-60">
              {debugInfo}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("pdfImport.ui.modal_title")}</DialogTitle>
            <DialogDescription>
              {t("pdfImport.ui.modal_desc")}
              <div className="mt-2 text-sm text-muted-foreground">
                {t("pdfImport.ui.found_selected", { found: draft.length, selected: selectedCount, total: draft.length })}
              </div>
            </DialogDescription>
          </DialogHeader>

          {draft.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("pdfImport.ui.no_draft")}</div>
          ) : (
            <div className="space-y-4">
              {draft.map((q, idx) => (
                <div key={q.tempId} className="border rounded-lg p-4">
                  <div className="font-bold mb-3">
                    {idx + 1}. {q.text}
                  </div>

                  {q.imageUrl && (
                    <div className="mt-2 mb-4">
                      <div className="overflow-hidden rounded-xl border bg-white">
                        <img src={q.imageUrl} alt={t("pdfImport.ui.image_alt")} className="w-full h-auto block" loading="lazy" />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {q.page ? (
                          <div className="text-xs text-muted-foreground">{t("pdfImport.ui.pdf_page", { page: q.page })}</div>
                        ) : (
                          <div />
                        )}
                        <a href={q.imageUrl} target="_blank" rel="noreferrer" className="text-xs underline text-primary">
                          {t("pdfImport.ui.zoom_image")}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const checked = selectedCorrect[q.tempId] === opt.tempOptionId
                      return (
                        <label
                          key={opt.tempOptionId}
                          className={`flex gap-3 items-start p-3 rounded-lg border cursor-pointer ${
                            checked ? "border-primary bg-blue-50" : "border-muted hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.tempId}
                            checked={checked}
                            onChange={() => setSelectedCorrect((prev) => ({ ...prev, [q.tempId]: opt.tempOptionId }))}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{String.fromCharCode(65 + optIdx)})</span>
                              <span className="text-sm leading-relaxed">{opt.text}</span>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              {t("common.close")}
            </Button>
            <Button onClick={handleSendToBackend} disabled={!canSave || saving}>
              {saving
                ? t("pdfImport.ui.sending")
                : t("pdfImport.ui.save_selected_to_db", { count: selectedCount })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
