"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, CreditCard, Sparkles, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

const PRESET_AMOUNTS = [5, 10, 20, 50, 100]

export default function BalancePage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [amount, setAmount] = useState<number | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const currentBalance = typeof user?.balance === "number" ? user.balance : Number(user?.balance || 0)

  async function handlePay() {
    setError("")
    if (!amount || Number(amount) <= 0) {
      setError("Məbləğ daxil edin (pozitiv rəqəm)")
      return
    }
    if (!user?.id) {
      setError("İstifadəçi ID tapılmadı")
      return
    }

    setLoading(true)
    try {
      const { redirect_url } = await api.initiatePayment(
        user.id,
        Number(amount),
        `balance_${user.id}_${Date.now()}`,
        "Balans artırılması"
      )

      window.location.href = redirect_url
    } catch (err: any) {
      setError(err.message || "Ödəniş başlatmaq alınmadı")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col relative">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <main className="container mx-auto px-4 py-8 pt-24">
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
              <p className="text-4xl font-bold">{currentBalance.toFixed(2)} AZN</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-950/80 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {t("selectAmount")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset ? "default" : "outline"}
                    className="h-16"
                    onClick={() => setAmount(preset)}
                    disabled={loading}
                  >
                    {preset} AZN
                  </Button>
                ))}
              </div>

              <div>
                <Label className="pb-2">{t("customAmount")}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  disabled={loading}
                />
              </div>

              {error && <p className="text-red-600 text-center font-medium">{error}</p>}

              <Button
                className="w-full h-14 text-lg"
                onClick={handlePay}
                disabled={loading || !amount || Number(amount) <= 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Hazırlanır...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    {t("payNow")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}