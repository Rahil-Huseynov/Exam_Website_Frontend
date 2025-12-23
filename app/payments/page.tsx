"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Receipt } from "lucide-react"

interface Transaction {
  id: number
  type: "deposit" | "purchase" | "refund"
  amount: number
  description: string
  date: string
  status: "completed" | "pending" | "failed"
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    try {
      setLoading(true)
      const attempts = await api.getAttempts()

      const txs: Transaction[] = attempts
        .filter((a) => a.completedAt)
        .map((a) => ({
          id: a.id,
          type: "purchase" as const,
          amount: a.exam.price,
          description: `${a.exam.subject.name} - ${a.exam.university.name} (${a.exam.year})`,
          date: a.completedAt!,
          status: "completed" as const,
        }))

      setTransactions(txs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }

  function getTransactionIcon(type: Transaction["type"]) {
    switch (type) {
      case "deposit":
        return <Download className="h-4 w-4 text-green-500" />
      case "purchase":
        return <CreditCard className="h-4 w-4 text-primary" />
      case "refund":
        return <Receipt className="h-4 w-4 text-orange-500" />
    }
  }

  function getStatusColor(status: Transaction["status"]) {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 hover:bg-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20"
      case "failed":
        return "bg-red-500/10 text-red-700 hover:bg-red-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
              {t("paymentHistory")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {locale === "az" && "Ödəniş və əməliyyat tarixçənizə baxın"}
              {locale === "en" && "View your payment and transaction history"}
              {locale === "ru" && "Просмотрите историю платежей и транзакций"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("yourBalance")}</CardTitle>
                <CreditCard className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  {user?.balance.toFixed(2)} AZN
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {locale === "az" && "Mövcud balans"}
                  {locale === "en" && "Available balance"}
                  {locale === "ru" && "Доступный баланс"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalSpent")}</CardTitle>
                <Receipt className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  {transactions.reduce((sum, tx) => (tx.type === "purchase" ? sum + tx.amount : sum), 0).toFixed(2)} AZN
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {locale === "az" && "Ümumi xərc"}
                  {locale === "en" && "All time spending"}
                  {locale === "ru" && "Общие расходы"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === "az" && "Əməliyyatlar"}
                  {locale === "en" && "Transactions"}
                  {locale === "ru" && "Транзакции"}
                </CardTitle>
                <Download className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  {transactions.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {locale === "az" && "Ümumi əməliyyat"}
                  {locale === "en" && "Total transactions"}
                  {locale === "ru" && "Всего транзакций"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
            <CardHeader>
              <CardTitle className="text-2xl">{t("transactionHistory")}</CardTitle>
              <CardDescription>
                {locale === "az" && "Son əməliyyatlarınızın siyahısı"}
                {locale === "en" && "List of your recent transactions"}
                {locale === "ru" && "Список ваших последних транзакций"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("noTransactions")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 border border-purple-100 rounded-xl bg-gradient-to-r from-purple-50/50 to-cyan-50/50 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <Badge variant="secondary" className={getStatusColor(tx.status)}>
                          {t(tx.status)}
                        </Badge>
                        <p className="font-bold text-lg bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                          {tx.amount.toFixed(2)} AZN
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
