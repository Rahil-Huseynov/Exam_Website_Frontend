"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                {t("adminPanel")}
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">{t("systemOverview")}</p>
            </div>

            <div className="flex justify-center items-center gap-6">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-xl cursor-pointer text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl">
                  <DropdownMenuItem onClick={() => setLocale("az")} className="rounded-xl cursor-pointer">
                    {t("navbar.lang.az")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocale("en")} className="rounded-xl cursor-pointer">
                    {t("navbar.lang.en")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocale("ru")} className="rounded-xl cursor-pointer">
                    {t("navbar.lang.ru")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  --
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("adminCardUsersHint")}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalExams")}</CardTitle>
                <BookOpen className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  --
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("adminCardExamsHint")}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  -- AZN
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("adminCardRevenueHint")}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("examsTaken")}</CardTitle>
                <FileText className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  --
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("adminCardTakenHint")}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="exams" className="space-y-6">
            <TabsList className="bg-white/90 border border-purple-100">
              <TabsTrigger value="exams">{t("manageExams")}</TabsTrigger>
              <TabsTrigger value="universities">{t("manageUniversities")}</TabsTrigger>
              <TabsTrigger value="subjects">{t("manageSubjects")}</TabsTrigger>
              <TabsTrigger value="balance">{t("balance")}</TabsTrigger>
              <TabsTrigger value="admin">{t("admin")}</TabsTrigger>
              <TabsTrigger value="news">{t("news")}</TabsTrigger>
            </TabsList>

            <TabsContent value="exams">
              <ExamsTab />
            </TabsContent>

            <TabsContent value="universities">
              <UniversitiesTab />
            </TabsContent>

            <TabsContent value="subjects">
              <SubjectsTab />
            </TabsContent>

            <TabsContent value="balance">
              <BalanceTopUpTab />
            </TabsContent>

            <TabsContent value="admin">
              <AdminsTab />
            </TabsContent>

             <TabsContent value="news">
              <AdminNewsPage />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
