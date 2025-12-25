"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { api, type University, type Subject, type Exam } from "@/lib/api"
import { useLocale } from "@/contexts/locale-context"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  CalendarDays,
  BookOpen,
  Search,
  Layers,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

import { toastError } from "@/lib/toast"

type Step = 1 | 2 | 3

function tName(obj: any, locale: string) {
  if (!obj) return ""
  if (locale === "az") return obj.nameAz || obj.name
  if (locale === "ru") return obj.nameRu || obj.name
  return obj.nameEn || obj.name
}

function uniqSortedDesc(nums: number[]) {
  return Array.from(new Set(nums)).sort((a, b) => b - a)
}

export function ExamWizard({ userId }: { userId: number }) {
  const router = useRouter()
  const { locale } = useLocale()

  const [step, setStep] = useState<Step>(1)

  const [universities, setUniversities] = useState<University[]>([])
  const [uniLoading, setUniLoading] = useState(false)
  const [selectedUni, setSelectedUni] = useState<University | null>(null)

  const [metaLoading, setMetaLoading] = useState(false)
  const [years, setYears] = useState<number[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)

  const [examsLoading, setExamsLoading] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [q, setQ] = useState("")

  const lastErrRef = useRef("")

  const base = "transition-all duration-300 ease-out"
  const active = "opacity-100 translate-x-0"
  const hiddenLeft = "opacity-0 -translate-x-6 pointer-events-none absolute inset-0"
  const hiddenRight = "opacity-0 translate-x-6 pointer-events-none absolute inset-0"

  useEffect(() => {
    ;(async () => {
      try {
        setUniLoading(true)
        const list = await api.getUniversities()
        setUniversities(Array.isArray(list) ? list : [])
      } catch (e: any) {
        toastError(e?.message || "Universitet siyahısı yüklənmədi")
      } finally {
        setUniLoading(false)
      }
    })()
  }, [])

  async function selectUniversity(u: University) {
    setSelectedUni(u)
    setStep(2)

    setSelectedYear(null)
    setSelectedSubjectId(null)
    setYears([])
    setSubjects([])
    setExams([])
    setQ("")

    try {
      setMetaLoading(true)

      const list = await api.getExamsByFilter(u.id)

      const safeList = Array.isArray(list) ? list : []

      const ys = uniqSortedDesc(
        safeList.map((x: any) => Number(x?.year)).filter((n: any) => Number.isFinite(n)),
      )
      setYears(ys)

      const subMap = new Map<string, Subject>()
      for (const ex of safeList as any[]) {
        if (ex?.subject?.id) subMap.set(String(ex.subject.id), ex.subject)
      }
      setSubjects(Array.from(subMap.values()))
    } catch (e: any) {
      toastError(e?.message || "Məlumatlar yüklənmədi (universitet)")
    } finally {
      setMetaLoading(false)
    }
  }

  const canGoNext = Boolean(selectedUni && selectedYear && selectedSubjectId && !metaLoading)

  async function goStep3AndLoad() {
    if (!selectedUni) return
    if (!selectedYear || !selectedSubjectId) {
      toastError("Zəhmət olmasa fənn və ili seçin")
      return
    }

    setStep(3)
    setExams([])
    setQ("")

    try {
      setExamsLoading(true)

      const list = await api.getExamsByFilter(selectedUni.id, selectedSubjectId, selectedYear)

      setExams(Array.isArray(list) ? list : [])
    } catch (e: any) {
      toastError(e?.message || "İmtahanlar yüklənmədi")
    } finally {
      setExamsLoading(false)
    }
  }

  function goBack() {
    if (step === 3) {
      setStep(2)
      setExams([])
      setQ("")
      return
    }
    if (step === 2) {
      setStep(1)
      setSelectedUni(null)
      setYears([])
      setSubjects([])
      setSelectedYear(null)
      setSelectedSubjectId(null)
      setExams([])
      setQ("")
      return
    }
  }

  const selectedSubject = useMemo(
    () => subjects.find((s) => String(s.id) === String(selectedSubjectId)),
    [subjects, selectedSubjectId],
  )

  const filteredExams = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return exams
    return exams.filter((e: any) => {
      const title = String(e?.title || "").toLowerCase()
      const subj = String(e?.subject?.name || "").toLowerCase()
      return title.includes(s) || subj.includes(s)
    })
  }, [exams, q])

  async function startExam(exam: Exam) {
    try {
      const res = await api.createAttempt(exam.id, userId) 
      const attemptId = (res as any)?.attemptId
      if (!attemptId) throw new Error("İmtahana başlamaq alınmadı")
      router.push(`/attempt/${attemptId}`)
    } catch (e: any) {
      const msg = e?.message || "İmtahana başlamaq alınmadı"
      if (lastErrRef.current !== msg) {
        lastErrRef.current = msg
        toastError(msg)
      }
    }
  }

  return (
    <Card className="border-2 rounded-3xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              İmtahan seçimi
            </div>

            <CardTitle className="text-xl flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              İmtahanı seç və başla
            </CardTitle>

            <CardDescription>
              Addım-addım seç: əvvəl universitet → sonra fənn və il → sonda uyğun imtahanlar.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              Addım {step}/3
            </Badge>

            {step > 1 && (
              <Button variant="outline" className="rounded-2xl" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full border flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${step >= 1 ? "opacity-100" : "opacity-30"}`} />
            Universitet
          </span>
          <span className="px-3 py-1 rounded-full border flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${step >= 2 ? "opacity-100" : "opacity-30"}`} />
            Fənn & İl
          </span>
          <span className="px-3 py-1 rounded-full border flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${step >= 3 ? "opacity-100" : "opacity-30"}`} />
            İmtahanlar
          </span>

          {selectedUni && (
            <span className="px-3 py-1 rounded-full border text-muted-foreground">
              Universitet: <span className="font-medium">{tName(selectedUni, locale)}</span>
            </span>
          )}
          {selectedSubject && (
            <span className="px-3 py-1 rounded-full border text-muted-foreground">
              Fənn: <span className="font-medium">{tName(selectedSubject, locale)}</span>
            </span>
          )}
          {selectedYear && (
            <span className="px-3 py-1 rounded-full border text-muted-foreground">
              İl: <span className="font-medium">{selectedYear}</span>
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative min-h-[320px]">
        {/* STEP 1 */}
        <div className={[base, step === 1 ? active : hiddenLeft].join(" ")}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 font-medium">
              <GraduationCap className="h-4 w-4" />
              Universitet seçin
            </div>

            {uniLoading && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Yüklənir...
              </div>
            )}
          </div>

          {universities.length === 0 && !uniLoading ? (
            <div className="text-sm text-muted-foreground">Hazırda universitet tapılmadı.</div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {universities.map((u) => {
                const name = tName(u, locale)
                return (
                  <button
                    key={u.id}
                    onClick={() => selectUniversity(u)}
                    className={[
                      "group aspect-square rounded-3xl border-2 p-4 text-left bg-card",
                      "hover:shadow-lg hover:-translate-y-0.5 transition-all",
                      "flex flex-col justify-between",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold leading-snug line-clamp-2">{name}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{u.name}</div>
                      </div>

                      {u.logo ? (
                        <img
                          src={u.logo}
                          alt={name}
                          className="h-11 w-11 rounded-2xl object-cover border group-hover:scale-[1.02] transition-transform"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-2xl border flex items-center justify-center text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Davam et</span>
                      <ArrowRight className="h-4 w-4 opacity-60 group-hover:opacity-90 transition-opacity" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* STEP 2 */}
        <div className={[base, step === 2 ? active : step < 2 ? hiddenRight : hiddenLeft].join(" ")}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 font-medium">
              <Layers className="h-4 w-4" />
              Fənn və ili seçin
            </div>

            {metaLoading && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Məlumatlar hazırlanır...
              </div>
            )}
          </div>

          {!selectedUni ? (
            <div className="text-sm text-muted-foreground">Universitet seçilməyib.</div>
          ) : (
            <div className="space-y-6">
              {/* Subjects */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4" />
                  Fənn
                </div>

                {subjects.length === 0 && !metaLoading ? (
                  <div className="text-sm text-muted-foreground">Bu universitet üçün fənn tapılmadı.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => {
                      const isActive = String(s.id) === String(selectedSubjectId)
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSubjectId(String(s.id))}
                          className={[
                            "px-4 py-2 rounded-2xl border text-sm transition-all",
                            isActive ? "border-primary/60 bg-primary/10 shadow-sm" : "border-border hover:bg-muted",
                          ].join(" ")}
                        >
                          {tName(s, locale)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Years */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  İl
                </div>

                {years.length === 0 && !metaLoading ? (
                  <div className="text-sm text-muted-foreground">Bu universitet üçün il tapılmadı.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {years.map((y) => {
                      const isActive = selectedYear === y
                      return (
                        <button
                          key={y}
                          onClick={() => setSelectedYear(y)}
                          className={[
                            "px-4 py-2 rounded-2xl border text-sm transition-all",
                            isActive ? "border-primary/60 bg-primary/10 shadow-sm" : "border-border hover:bg-muted",
                          ].join(" ")}
                        >
                          {y}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button className="rounded-2xl" onClick={goStep3AndLoad} disabled={!canGoNext}>
                  İmtahanları göstər
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3 */}
        <div className={[base, step === 3 ? active : hiddenRight].join(" ")}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 font-medium">
              <BookOpen className="h-4 w-4" />
              Uygun imtahanlar
            </div>

            <div className="w-full sm:max-w-xs relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Axtar: imtahan adı və ya fənn..."
                className="pl-9 rounded-2xl"
              />
            </div>
          </div>

          {examsLoading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              İmtahanlar yüklənir...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Bu seçimə uyğun imtahan tapılmadı. Başqa fənn və ya il seçə bilərsiniz.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((e) => (
                <Card key={e.id} className="rounded-3xl border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{e.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {e.subject?.name ? e.subject.name : "Fənn göstərilməyib"} • {e.year || "—"}
                        </CardDescription>
                      </div>

                      <Badge className="rounded-full">{Number((e as any).price || 0).toFixed(2)} AZN</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex items-center justify-end">
                    <Button className="rounded-2xl" onClick={() => startExam(e)}>
                      İmtahana başla
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
