"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { UniversitiesTab } from "@/components/admin/universities-tab"
import { SubjectsTab } from "@/components/admin/subjects-tab"
import { ExamsTab } from "@/components/admin/exams-tab"
import { BalanceTopUpTab } from "@/components/admin/balance-topup-tab"
import { AdminsTab } from "@/components/admin/admins-tab"

import { Users, BookOpen, DollarSign, FileText, LogOut, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminNewsPage from "@/components/admin/news-tab"
import { LogsTab } from "@/components/admin/logs-tab"
import { ResultsTab } from "@/components/admin/results-tab"

export default function AdminPage() {
  const { user, loading, logout } = useAuth()
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== "admin" && user.role !== "superadmin") {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        </main>
      </div>
    )
  }

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <main className="w-full min-h-screen px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex justify-between gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-balance bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                {t("adminPanel")}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{t("systemOverview")}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start sm:justify-end">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl cursor-pointer text-destructive text-xs sm:text-sm px-3 py-2 hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("logout")}</span>
                <span className="sm:hidden">{t("logout")}</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl sm:rounded-2xl">
                  <DropdownMenuItem
                    onClick={() => setLocale("az")}
                    className="rounded-lg cursor-pointer text-xs sm:text-sm"
                  >
                    {t("navbar.lang.az")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocale("en")}
                    className="rounded-lg cursor-pointer text-xs sm:text-sm"
                  >
                    {t("navbar.lang.en")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocale("ru")}
                    className="rounded-lg cursor-pointer text-xs sm:text-sm"
                  >
                    {t("navbar.lang.ru")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-purple-100 shadow-lg sm:shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-xs sm:text-sm font-medium">{t("totalUsers")}</CardTitle>
                <Users className="h-4 w-4 text-purple-500 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4">
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  --
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">{t("adminCardUsersHint")}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-lg sm:shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-xs sm:text-sm font-medium">{t("totalExams")}</CardTitle>
                <BookOpen className="h-4 w-4 text-cyan-500 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4">
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  --
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">{t("adminCardExamsHint")}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-lg sm:shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-xs sm:text-sm font-medium">{t("totalRevenue")}</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4">
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  -- AZN
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">{t("adminCardRevenueHint")}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-lg sm:shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-xs sm:text-sm font-medium">{t("examsTaken")}</CardTitle>
                <FileText className="h-4 w-4 text-cyan-500 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4">
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  --
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">{t("adminCardTakenHint")}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="exams" className="space-y-4 sm:space-y-6 w-full overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
              <TabsList className="bg-white/90 border border-purple-100 rounded-lg sm:rounded-xl inline-flex min-w-full sm:w-full gap-1 sm:gap-2 p-1 sm:p-2">
                <TabsTrigger value="exams" className="text-xs sm:text-sm whitespace-nowrap">
                  {t("manageExams")}
                </TabsTrigger>
                <TabsTrigger value="universities" className="text-xs sm:text-sm whitespace-nowrap">
                  {t("manageUniversities")}
                </TabsTrigger>
                <TabsTrigger value="subjects" className="text-xs sm:text-sm whitespace-nowrap">
                  {t("manageSubjects")}
                </TabsTrigger>
                <TabsTrigger value="balance" className="text-xs sm:text-sm whitespace-nowrap">
                  {t("balance")}
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs sm:text-sm whitespace-nowrap">
                  {t("admin")}
                </TabsTrigger>
                <TabsTrigger value="news" className="text-xs sm:text-sm whitespace-nowrap">
                  {t("news")}
                </TabsTrigger>
                <TabsTrigger value="logs" className="text-xs sm:text-sm whitespace-nowrap">
                  {t("logsTitle")}
                </TabsTrigger>
                <TabsTrigger value="results" className="text-xs sm:text-sm whitespace-nowrap">
                  {t("resultsTitle")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="exams" className="overflow-x-auto">
              <ExamsTab />
            </TabsContent>

            <TabsContent value="universities" className="overflow-x-auto">
              <UniversitiesTab />
            </TabsContent>

            <TabsContent value="subjects" className="overflow-x-auto">
              <SubjectsTab />
            </TabsContent>

            <TabsContent value="balance" className="overflow-x-auto">
              <BalanceTopUpTab />
            </TabsContent>

            <TabsContent value="admin" className="overflow-x-auto">
              <AdminsTab />
            </TabsContent>

            <TabsContent value="news" className="overflow-x-auto">
              <AdminNewsPage />
            </TabsContent>

            <TabsContent value="logs" className="overflow-x-auto">
              <LogsTab />
            </TabsContent>

            <TabsContent value="results" className="overflow-x-auto">
              <ResultsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
