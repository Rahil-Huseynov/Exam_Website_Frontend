"use client"

import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Wallet, CreditCard, Sparkles, MessageCircle } from "lucide-react"

const PRESET_AMOUNTS = [5, 10, 20, 50, 100]

export default function BalancePage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const phone = "994501234567"

  const publicId = user?.publicId || "-"
  const firstName = user?.firstName || "-"
  const lastName = user?.lastName || "-"

  const whatsappText = `Salam, balansımı artırmaq istəyirəm. IDim: ${publicId}. Ad: ${firstName}, Soyad: ${lastName}`

  const WHATSAPP_LINK = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`

  const currentBalance =
    typeof user?.balance === "number" ? user.balance : Number(user?.balance || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col relative">
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <main className="container mx-auto px-4 py-8 flex-1 blur-[6px] pointer-events-none select-none">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t("addBalance")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {t("balanceSubtitle")}
            </p>
          </div>

          <Card className="bg-white/80 dark:bg-gray-950/80 shadow-2xl">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>{t("yourBalance")}</CardTitle>
                <CardDescription>{t("balanceCurrentDesc")}</CardDescription>
              </div>
              <Wallet className="h-10 w-10 text-violet-600" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {currentBalance.toFixed(2)} AZN
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-950/80 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {t("selectAmount")}
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map((amount) => (
                <Button key={amount} variant="outline" className="h-16">
                  {amount} AZN
                </Button>
              ))}

              <div className="col-span-3">
                <Label>{t("customAmount")}</Label>
                <Input placeholder="0.00" />
              </div>

              <Button className="col-span-3 h-14">
                <CreditCard className="mr-2 h-5 w-5" />
                {t("payNow")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      <div className="absolute inset-0 z-49 flex items-center justify-center p-4">
        <div className="absolute inset-0" />

        <div className="relative max-w-md w-full bg-white dark:bg-gray-950 rounded-2xl shadow-2xl p-6 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
            <MessageCircle className="h-7 w-7 text-green-600" />
          </div>

          <h2 className="text-xl font-bold mb-2">
            {t("balanceWhatsappTitle")}
          </h2>

          <p className="text-muted-foreground mb-6">
            {t("balanceWhatsappDesc")}
          </p>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 transition"
          >
            <MessageCircle className="h-5 w-5" />
            {t("balanceWhatsappBtn")}
          </a>
        </div>
      </div>
    </div>
  )
}
