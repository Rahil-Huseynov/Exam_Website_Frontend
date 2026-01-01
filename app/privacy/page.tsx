"use client"

import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Database, Lock, FileCheck } from "lucide-react"

export default function PrivacyPage() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      <PublicNavbar />

      <main className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t("privacyTitle")}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{t("privacyIntro")}</p>
          </div>

          <div className="space-y-6">
            <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">{t("dataCollection")}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-14">{t("dataCollectionText")}</p>
              </div>
            </Card>

            <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">{t("dataUsage")}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-14">{t("dataUsageText")}</p>
              </div>
            </Card>

            <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">{t("dataSecurity")}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-14">{t("dataSecurityText")}</p>
              </div>
            </Card>
          </div>

          <Card className="p-8 rounded-3xl border-2 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">{t("privacyQuestionsTitle")}</h3>

              <p className="text-muted-foreground">
                {t("privacyQuestionsEmailPrefix")}{" "}
                <a href="mailto:privacy@imtahanver.net" className="text-primary font-semibold hover:underline">
                  privacy@imtahanver.net
                </a>
              </p>
            </div>
          </Card>

          <div className="text-center text-sm text-muted-foreground pt-8">
            {t("privacyLastUpdated")}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
