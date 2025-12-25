"use client"

import { useMemo, useState } from "react"
import { api, type DraftQuestion } from "@/lib/api"
import { readPdfText } from "@/lib/pdf-read"
import { parseQuestionsFromText } from "@/lib/pdf-parser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

type Props = { bankId: string }

export default function PdfImportFrontModal({ bankId }: Props) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<DraftQuestion[]>([])
  const [selectedCorrect, setSelectedCorrect] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const selectedCount = useMemo(() => {
    if (!draft.length) return 0
    return draft.filter((q) => !!selectedCorrect[q.tempId]).length
  }, [draft, selectedCorrect])

  const canSave = useMemo(() => {
    if (!draft.length) return false
    return draft.every((q) => !!selectedCorrect[q.tempId])
  }, [draft, selectedCorrect])

  async function handlePickPdf(f: File) {
    setError("")
    setLoading(true)
    try {
      const text = await readPdfText(f)
      const parsed = parseQuestionsFromText(text)

      setDraft(parsed)
      setSelectedCorrect({})
      setOpen(true)
    } catch (e: any) {
      setError(e?.message || "PDF oxuma xətası")
    } finally {
      setLoading(false)
    }
  }

  async function handleSendToBackend() {
    setError("")
    if (!canSave) {
      setError("Bütün suallarda doğru cavabı seç!")
      return
    }

    setSaving(true)
    try {
      const payload = {
        questions: draft.map((q) => {
          const correctTemp = selectedCorrect[q.tempId]
          const correctOpt = q.options.find((o) => o.tempOptionId === correctTemp)
          if (!correctOpt) throw new Error("Correct option tapılmadı")

          return {
            text: q.text,
            options: q.options.map((o) => ({ text: o.text })),
            correctAnswerText: correctOpt.text,
          }
        }),
      }

      await api.importQuestionsDirect(bankId, payload)

      setOpen(false)
      setFile(null)
      setDraft([])
      setSelectedCorrect({})
      alert("DB-yə yazıldı ✅")
    } catch (e: any) {
      setError(e?.message || "Göndərmə xətası")
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
          const f = e.target.files?.[0] || null
          setFile(f)
          if (f) await handlePickPdf(f)
        }}
      />

      {loading && <div className="text-sm text-muted-foreground">PDF oxunur...</div>}
      {error && <div className="text-sm text-red-600 font-semibold">{error}</div>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PDF Draft (Front)</DialogTitle>
            <DialogDescription>
              Hər sual üçün doğru cavabı seç və sonra backendə göndər.
              <div className="mt-2 text-sm text-muted-foreground">
                Seçilən: {selectedCount}/{draft.length}
              </div>
            </DialogDescription>
          </DialogHeader>

          {draft.length === 0 ? (
            <div className="text-sm text-muted-foreground">Draft yoxdur</div>
          ) : (
            <div className="space-y-4">
              {draft.map((q, idx) => (
                <div key={q.tempId} className="border rounded-lg p-4">
                  <div className="font-bold mb-3">
                    {idx + 1}. {q.text}
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const checked = selectedCorrect[q.tempId] === opt.tempOptionId
                      return (
                        <label
                          key={opt.tempOptionId}
                          className={`flex gap-3 items-start p-3 rounded-lg border cursor-pointer ${
                            checked ? "border-primary" : "border-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.tempId}
                            checked={checked}
                            onChange={() => setSelectedCorrect((p) => ({ ...p, [q.tempId]: opt.tempOptionId }))}
                          />
                          <span className="text-sm leading-relaxed">{opt.text}</span>
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
              Bağla
            </Button>
            <Button onClick={handleSendToBackend} disabled={!canSave || saving}>
              {saving ? "Göndərilir..." : "Backendə göndər (DB-yə yaz)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
