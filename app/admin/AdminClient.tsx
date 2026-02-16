"use client"

import { useEffect, useState } from "react"
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
import PdfConverterPage from "@/components/admin/pdfconverter"
import PDFCreatorPage from "@/components/admin/pdf-creator"
import SettingsPage from "@/components/admin/settings"
import AdminUsersTab from "@/components/admin/users-tab"
import { api, Starts } from "@/lib/api"
import { toast } from "react-toastify"
import { Navbar } from "@/components/navbar"
import { PublicNavbar } from "@/components/public-navbar"



export default function AdminPage() {
  const { user, loading } = useAuth()
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)
  const router = useRouter()


  const [stats, setStats] = useState<Starts | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const loadStarts = async () => {
    try {
      setStatsLoading(true)
      const res = await api.getDataStarts()

      setStats(res)

    } catch (e: any) {
      toast.error(t("errAdminsLoad"))
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadStarts()
  }, [])

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
    window.location.href = "/login"
  }

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
  const isSuperAdmin = user?.role === "superadmin"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      {user ? <Navbar /> : <PublicNavbar />}

      <main className="w-full min-h-screen px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex justify-between gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-balance bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                {t("adminPanel")}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{t("systemOverview")}</p>
            </div>
          </div>

          {isSuperAdmin ?
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-purple-100 shadow-lg sm:shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="text-xs sm:text-sm font-medium">{t("totalUsers")}</CardTitle>
                  <Users className="h-4 w-4 text-purple-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    {stats?.totalUsers}
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
                    {stats?.totalExams}
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
                    {stats?.totalRevenue} AZN
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
                    {stats?.totalAttempts}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 sm:mt-2">{t("adminCardTakenHint")}</p>
                </CardContent>
              </Card>
            </div>
            : ''}

          <Tabs defaultValue="exams" className="space-y-4 sm:space-y-6 w-full overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
              <TabsList className="bg-white/90 border border-purple-100 rounded-lg sm:rounded-xl inline-flex min-w-full h-full sm:w-full gap-1 sm:gap-2 p-1 sm:p-2">
                <TabsTrigger value="exams" className="text-xs sm:text-sm whitespace-nowrap 
    data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600
">
                  {t("manageExams")}
                </TabsTrigger>
                {isSuperAdmin && (
                  <TabsTrigger value="universities" className="text-xs sm:text-sm whitespace-nowrap 
    data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600
    ">
                    {t("manageUniversities")}
                  </TabsTrigger>
                )}

                {isSuperAdmin && (
                  <TabsTrigger value="subjects" className="text-xs sm:text-sm whitespace-nowrap
                    data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                    {t("manageSubjects")}
                  </TabsTrigger>
                )}

                {isSuperAdmin && (
                  <TabsTrigger value="balance" className="text-xs sm:text-sm whitespace-nowrap
                    data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                    {t("balance")}
                  </TabsTrigger>
                )}

                {isSuperAdmin && (
                  <TabsTrigger value="admin" className="text-xs sm:text-sm whitespace-nowrap   data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                    {t("adminsTitle")}
                  </TabsTrigger>
                )}

                {isSuperAdmin && (
                  <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap   data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                    {t("users.title")}
                  </TabsTrigger>
                )}

                <TabsTrigger value="news" className="text-xs sm:text-sm whitespace-nowrap   data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                  {t("news")}
                </TabsTrigger>

                {isSuperAdmin && (
                  <TabsTrigger value="logs" className="text-xs sm:text-sm whitespace-nowrap   data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                    {t("logsTitle")}
                  </TabsTrigger>
                )}

                <TabsTrigger value="results" className="text-xs sm:text-sm whitespace-nowrap   data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                  {t("resultsTitle")}
                </TabsTrigger>

                <TabsTrigger value="pdfconverter" className="text-xs sm:text-sm whitespace-nowrap   data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                  {t("pdf.title")}
                </TabsTrigger>

                <TabsTrigger value="pdfcreator" className="text-xs sm:text-sm whitespace-nowrap   data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                  {t("pdfcreator")}
                </TabsTrigger>

                {isSuperAdmin && (
                  <TabsTrigger value="settings" className="text-xs sm:text-sm whitespace-nowrap   data-[state=active]:bg-purple-600
    data-[state=active]:text-white
    data-[state=active]:border-purple-600">
                    {t("settings")}
                  </TabsTrigger>
                )}

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

            <TabsContent value="users" className="overflow-x-auto">
              <AdminUsersTab />
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

            <TabsContent value="pdfconverter" className="overflow-x-auto">
              <PdfConverterPage />
            </TabsContent>

            <TabsContent value="pdfcreator" className="overflow-x-auto">
              <PDFCreatorPage />
            </TabsContent>

            <TabsContent value="settings" className="overflow-x-auto">
              <SettingsPage />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
