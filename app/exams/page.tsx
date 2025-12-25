"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { api, type Exam, type University, type Subject } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Filter, Sparkles } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

function tokenBankKey(token: string) {
  return `exam_token_bank_${token}`
}
function setTokenBank(token: string, bankId: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(tokenBankKey(token), bankId)
}

export default function ExamsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [exams, setExams] = useState<Exam[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const [startingId, setStartingId] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError("")
        const [examsData, universitiesData, subjectsData] = await Promise.all([
          api.getExams(),
          api.getUniversities(),
          api.getSubjects(),
        ])
        setExams(Array.isArray(examsData) ? examsData : [])
        setUniversities(Array.isArray(universitiesData) ? universitiesData : [])
        setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      } catch (err: any) {
        const msg = err?.message || "Failed to load exams"
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const years = useMemo(() => Array.from(new Set(exams.map((e) => e.year))).sort((a, b) => b - a), [exams])

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        searchTerm === "" ||
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.university.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesUniversity = selectedUniversity === "all" || String(exam.university.id) === selectedUniversity
      const matchesSubject = selectedSubject === "all" || String(exam.subject.id) === selectedSubject
      const matchesYear = selectedYear === "all" || String(exam.year) === selectedYear

      return matchesSearch && matchesUniversity && matchesSubject && matchesYear
    })
  }, [exams, searchTerm, selectedUniversity, selectedSubject, selectedYear])

  async function startExam(exam: Exam) {
    try {
      if (!user?.id) {
        toast.error("İmtahana başlamaq üçün giriş edin.")
        router.push("/login")
        return
      }

      setStartingId(String(exam.id))

      const bankId = String((exam as any).bankId ?? exam.id ?? "")
      if (!bankId) {
        toast.error("bankId tapılmadı.")
        return
      }

      const tok = await api.createExamToken(bankId, user.id)
      const token = String(tok?.token || "")

      if (!token) {
        toast.error("Token yaradılmadı.")
        return
      }
      setTokenBank(token, bankId)

      router.push(`/exam-token/${token}`)
    } catch (e: any) {
      toast.error(e?.message || "İmtahana başlamaq olmadı.")
    } finally {
      setStartingId("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      <Navbar />
      <ToastContainer position="top-right" autoClose={2200} newestOnTop closeOnClick pauseOnHover theme="colored" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              İmtahanlar
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">İmtahan seçin və başlayın</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-5 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Axtar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md"
                />
              </div>
            </div>

            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Universitet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı</SelectItem>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={String(uni.id)}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Fənn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı</SelectItem>
                {subjects.map((subj) => (
                  <SelectItem key={subj.id} value={String(subj.id)}>
                    {subj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="İl" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-900 border-t-violet-600" />
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-violet-400 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Heç bir imtahan tapılmadı</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam) => {
                const isStarting = startingId === String(exam.id)
                return (
                  <Card
                    key={exam.id}
                    className="flex flex-col backdrop-blur-sm bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs font-medium">
                          {exam.year}
                        </span>
                      </div>
                      <CardTitle className="text-balance">{exam.title}</CardTitle>
                      <CardDescription className="space-y-1">
                        <div>{exam.university.name}</div>
                        <div className="font-medium text-violet-600">{exam.subject.name}</div>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20">
                          <span className="text-muted-foreground">Sual:</span>
                          <span className="font-bold text-violet-600">{(exam as any).questionCount ?? "-"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                          <span className="text-muted-foreground">Qiymət:</span>
                          <span className="font-bold text-blue-600">{Number(exam.price).toFixed(2)} AZN</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                        disabled={isStarting}
                        onClick={() => void startExam(exam)}
                      >
                        {isStarting ? "Token yaradılır..." : "İmtahana başla"}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
