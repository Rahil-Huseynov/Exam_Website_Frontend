"use client"

import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { GraduationCap, Target, Eye, Users } from "lucide-react"

export default function AboutPage() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      <PublicNavbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t("aboutTitle")}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">{t("aboutDescription")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">{t("ourMission")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("missionText")}</p>
              </div>
            </Card>

            <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">{t("ourVision")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("visionText")}</p>
              </div>
            </Card>
          </div>

          <Card className="p-12 rounded-3xl border-2 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-sm text-muted-foreground">
                  {locale === "az" ? "Tələbə" : locale === "en" ? "Students" : "Студенты"}
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-sm text-muted-foreground">
                  {locale === "az" ? "İmtahan" : locale === "en" ? "Exams" : "Экзамены"}
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  50+
                </div>
                <div className="text-sm text-muted-foreground">
                  {locale === "az" ? "Universitet" : locale === "en" ? "Universities" : "Университеты"}
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  95%
                </div>
                <div className="text-sm text-muted-foreground">
                  {locale === "az" ? "Məmnuniyyət" : locale === "en" ? "Satisfaction" : "Удовлетворенность"}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: GraduationCap,
                title:
                  locale === "az"
                    ? "Peşəkar İmtahanlar"
                    : locale === "en"
                      ? "Professional Exams"
                      : "Профессиональные экзамены",
              },
              {
                icon: Users,
                title:
                  locale === "az" ? "İstifadəçi Dəstəyi" : locale === "en" ? "User Support" : "Поддержка пользователей",
              },
              {
                icon: Target,
                title: locale === "az" ? "Dəqiq Nəticələr" : locale === "en" ? "Accurate Results" : "Точные результаты",
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="p-6 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300"
              >
                <div className="space-y-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
