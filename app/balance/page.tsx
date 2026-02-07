"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api } from "@/lib/api"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Wallet, CreditCard, Sparkles } from "lucide-react"

import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const PRESET_AMOUNTS = [5, 10, 20, 50, 100]

export default function BalancePage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [customAmount, setCustomAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const currentBalance =
    typeof user?.balance === "number" ? user.balance : Number(user?.balance || 0)

  const selectedAmount = (() => {
    const n = parseFloat(customAmount)
    return Number.isFinite(n) ? n : 0
  })()

  function handlePresetClick(a: number) {
    setCustomAmount(String(a))
  }

  function handleCustomChange(vRaw: string) {
    let v = vRaw.replace(/[^\d.]/g, "")
    const parts = v.split(".")
    if (parts.length > 2) {
      v = parts[0] + "." + parts.slice(1).join("")
    }
    if (parts[1]?.length > 2) {
      v = parts[0] + "." + parts[1].slice(0, 2)
    }
    setCustomAmount(v)
  }

  async function handlePay() {
    if (!selectedAmount || selectedAmount <= 0) {
      toast.error(t("invalidAmount") || "Məbləğ düzgün deyil")
      return
    }

    if (!user) {
      toast.info(t("pleaseLogin") || "Zəhmət olmasa daxil olun")
      return
    }

    setLoading(true)
    try {
      const orderId = `BALANCE_${user.id}_${Date.now()}`
      const res = await api.createPayment({
        amount: selectedAmount,
        order_id: orderId,
        description: "Balans artırılması",
        userId: user.id,
      })

      if (res.oneTimeToken) {
        sessionStorage.setItem("payment_token", res.oneTimeToken);
      }

      const redirect = (res && (res.redirect_url || res.redirectUrl || res.url)) as string | undefined

      if (redirect) {
        toast.info(t("redirectingToGateway") || "Ödəniş səhifəsinə yönləndirilir...")
        window.location.href = redirect
      } else {
        const serverMsg =
          (res && (res.message || (res as any).error || JSON.stringify(res))) || ""
        toast.error(t("paymentLinkNotReceived") || "Ödəniş linki alınmadı")
        if (serverMsg) {
          toast.error(serverMsg)
        }
      }
    } catch (err: any) {
      const msg = err?.message || (t("paymentError") || "Ödəniş zamanı xəta baş verdi")
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {/* ToastContainer: əgər layihənin rootunda varsa, buradan çıxara bilərsən */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1 pt-24">
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
              {PRESET_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  variant={selectedAmount === amt ? "default" : "outline"}
                  className="h-16"
                  onClick={() => handlePresetClick(amt)}
                >
                  {amt} AZN
                </Button>
              ))}

              <div className="col-span-3">
                <Label className="pb-2">{t("customAmount")}</Label>
                <Input
                  placeholder="0.00"
                  value={customAmount}
                  inputMode="decimal"
                  onChange={(e) => handleCustomChange(e.target.value)}
                />
              </div>

              <Button
                className="col-span-3 h-14"
                onClick={handlePay}
                disabled={loading || selectedAmount <= 0}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {loading ? (t("loading") || "Yüklənir...") : `${t("payNow") || "Ödə"} ${selectedAmount ? `(${selectedAmount} AZN)` : ""}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
