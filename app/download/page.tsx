"use client"

import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Download, Play, Shield, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"

const SITE_URL = "https://imtahanver.net"

export default function DownloadPage() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const { user } = useAuth()

  const features = [
    {
      icon: Zap,
      title: t("downloadFeature1Title"),
      description: t("downloadFeature1Desc"),
    },
    {
      icon: Shield,
      title: t("downloadFeature2Title"),
      description: t("downloadFeature2Desc"),
    },
  ]

  const downloadJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/download#download`,
    url: `${SITE_URL}/download`,
    name: t("downloadTitle"),
    description: t("downloadSubtitle"),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(downloadJsonLd),
        }}
      />

      {user ? <Navbar /> : <PublicNavbar />}

      <main className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent mb-2">
              <Download className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t("downloadTitle")}
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("downloadSubtitle")}
            </p>
          </div>

          {/* Android APK Download */}
          <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Play className="w-7 h-7 text-white fill-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{t("downloadAndroidTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("downloadAndroidDesc")}</p>
                </div>
              </div>

              <a
                href="/downloads/imtahanver.apk"
                download
                className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                <Download className="w-5 h-5" />
                {t("downloadApkButton")}
              </a>

              <p className="text-xs text-muted-foreground text-center">
                {t("downloadApkNote")}
              </p>
            </div>
          </Card>

          {/* Features */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center">
              {t("downloadFeaturesTitle")}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <Card
                  key={idx}
                  className="p-6 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Still need help */}
          <Card className="p-8 rounded-3xl border-2 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold">
                {t("downloadStillTitle")}
              </h3>

              <p className="text-muted-foreground">
                {t("downloadStillDesc")}
              </p>

              <a
                href={`/${locale}/contact`}
                className="inline-block mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {t("contact")}
              </a>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}