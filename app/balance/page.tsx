"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, CreditCard, CheckCircle2, Sparkles } from "lucide-react"
import { Footer } from "@/components/footer"

const PRESET_AMOUNTS = [5, 10, 20, 50, 100]

export default function BalancePage() {
  const { user, refreshUser } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const currentBalance = typeof user?.balance === "number" ? user.balance : 0
  const balanceText = currentBalance.toFixed(2)

  const parsedCustomAmount = useMemo(() => {
    const n = Number.parseFloat(customAmount)
    return Number.isFinite(n) ? n : 0
  }, [customAmount])

  const currentAmount = selectedAmount ?? parsedCustomAmount

  async function handleAddBalance() {
    const amount = currentAmount

    if (!amount || amount <= 0) {
      setError(
        locale === "az"
          ? "Düzgün məbləğ daxil edin"
          : locale === "ru"
            ? "Введите правильную сумму"
            : "Enter a valid amount",
      )
      return
    }

    if (!user) return

    try {
      setLoading(true)
      setError("")
      await api.addBalance(user.id, amount)
      await refreshUser()
      setSuccess(true)
      setSelectedAmount(null)
      setCustomAmount("")
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add balance")
    } finally {
      setLoading(false)
    }
  }

  const newBalanceText = (currentBalance + (currentAmount || 0)).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t("addBalance")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {locale === "az" && "Hesabınıza balans əlavə edin"}
              {locale === "en" && "Add balance to your account"}
              {locale === "ru" && "Пополните баланс вашего аккаунта"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {locale === "az" && "Balans uğurla əlavə edildi!"}
                {locale === "en" && "Balance added successfully!"}
                {locale === "ru" && "Баланс успешно пополнен!"}
              </AlertDescription>
            </Alert>
          )}

          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{t("yourBalance")}</CardTitle>
                  <CardDescription className="text-base">
                    {locale === "az" && "Cari balansınız"}
                    {locale === "en" && "Your current balance"}
                    {locale === "ru" && "Ваш текущий баланс"}
                  </CardDescription>
                </div>
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="relative inline-block">
                <p className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  {balanceText} AZN
                </p>
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-400/10 to-blue-400/10 rounded-lg -z-10" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                {t("selectAmount")}
              </CardTitle>
              <CardDescription className="text-base">
                {locale === "az" && "Əlavə etmək istədiyiniz məbləği seçin"}
                {locale === "en" && "Choose the amount you want to add"}
                {locale === "ru" && "Выберите сумму, которую хотите добавить"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                {PRESET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    onClick={() => {
                      setSelectedAmount(amount)
                      setCustomAmount("")
                    }}
                    className={`h-20 text-lg font-bold border-2 ${
                      selectedAmount === amount
                        ? "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                        : "hover:border-violet-300"
                    }`}
                  >
                    {amount} AZN
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-amount" className="text-base">
                  {t("customAmount")}
                </Label>
                <Input
                  id="custom-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setSelectedAmount(null)
                  }}
                  className="h-12 text-lg"
                />
              </div>

              {currentAmount > 0 && (
                <div className="p-5 rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 space-y-3 border border-violet-200 dark:border-violet-900">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("amount")}:</span>
                    <span className="font-bold text-lg">{currentAmount.toFixed(2)} AZN</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>
                      {locale === "az" && "Yeni balans:"}
                      {locale === "en" && "New balance:"}
                      {locale === "ru" && "Новый баланс:"}
                    </span>
                    <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                      {newBalanceText} AZN
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddBalance}
                disabled={loading || currentAmount <= 0}
                className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {loading ? t("processing") : t("payNow")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("paymentMethod")}</CardTitle>
              <CardDescription>
                {locale === "az" && "Ödəniş üsulları tezliklə əlavə ediləcək"}
                {locale === "en" && "Payment methods coming soon"}
                {locale === "ru" && "Способы оплаты скоро будут добавлены"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {locale === "az" && "Bank kartı"}
                    {locale === "en" && "Credit/Debit Card"}
                    {locale === "ru" && "Банковская карта"}
                  </p>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
