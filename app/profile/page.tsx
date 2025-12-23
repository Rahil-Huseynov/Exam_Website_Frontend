"use client"

import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Wallet, Shield } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t("profile")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {locale === "az" && "Profil məlumatlarınıza baxın"}
              {locale === "en" && "View your profile information"}
              {locale === "ru" && "Просмотрите информацию вашего профиля"}
            </p>
          </div>

          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{user?.name}</CardTitle>
                  <CardDescription className="text-base capitalize flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4" />
                    {user?.role}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 border border-violet-200 dark:border-violet-900">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                  <p className="font-medium text-lg">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-900">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("balance")}</p>
                  <p className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {user?.balance.toFixed(2)} AZN
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
