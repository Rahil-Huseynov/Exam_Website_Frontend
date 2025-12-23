"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type Exam, type University, type Subject } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Filter, Sparkles } from "lucide-react"
import { Footer } from "@/components/footer"

export default function ExamsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [exams, setExams] = useState<Exam[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")

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
      setError(err instanceof Error ? err.message : "Failed to load exams")
    } finally {
      setLoading(false)
    }
  }

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      searchTerm === "" ||
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.university.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUniversity = selectedUniversity === "all" || exam.university.id.toString() === selectedUniversity

    const matchesSubject = selectedSubject === "all" || exam.subject.id.toString() === selectedSubject

    const matchesYear = selectedYear === "all" || exam.year.toString() === selectedYear

    return matchesSearch && matchesUniversity && matchesSubject && matchesYear
  })

  const years = Array.from(new Set(exams.map((e) => e.year))).sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t("availableExams")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {locale === "az" && "İmtahan seçin və hazırlığa başlayın"}
              {locale === "en" && "Choose an exam and start preparing"}
              {locale === "ru" && "Выберите экзамен и начните подготовку"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-5 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={t("search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md"
                />
              </div>
            </div>

            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("university")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id.toString()}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("subject")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {subjects.map((subj) => (
                  <SelectItem key={subj.id} value={subj.id.toString()}>
                    {subj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-white/20 shadow-md">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("year")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-900"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-600 absolute top-0"></div>
              </div>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-violet-400 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                {locale === "az" && "Heç bir imtahan tapılmadı"}
                {locale === "en" && "No exams found"}
                {locale === "ru" && "Экзаменов не найдено"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam) => (
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
                        <span className="text-muted-foreground">{t("questions")}:</span>
                        <span className="font-bold text-violet-600">{exam.questionCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                        <span className="text-muted-foreground">{t("price")}:</span>
                        <span className="font-bold text-blue-600">{exam.price.toFixed(2)} AZN</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className="w-full h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                      disabled={user && user.balance < exam.price}
                    >
                      <Link href={`/exam/${exam.id}`}>
                        {user && user.balance < exam.price ? t("insufficientBalance") : t("startExam")}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
