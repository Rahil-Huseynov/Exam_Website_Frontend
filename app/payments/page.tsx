"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api, type BalanceHistoryResponse, type BalanceTransactionItem } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Receipt } from "lucide-react"

type UiTxType = "deposit" | "purchase" | "refund"
type UiTxStatus = "completed" | "pending" | "failed"

interface Transaction {
  id: string
  type: UiTxType
  amount: number
  description: string
  date: string
  status: UiTxStatus
}

function num(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function fmtMoneyAZN(v: number) {
  return `${v.toFixed(2)} AZN`
}

function buildDescription(tx: BalanceTransactionItem) {
  if (tx.type === "ADMIN_TOPUP") {
    const who = tx.admin
      ? `${tx.admin.firstName ?? ""} ${tx.admin.lastName ?? ""}`.trim() || tx.admin.email
      : ""
    return who ? `Admin: ${who}` : "Admin"
  }

  if (tx.bank) {
    return `${tx.bank.title} (${tx.bank.year})`
  }
  return tx.note || "Exam purchase"
}

function mapTx(tx: BalanceTransactionItem): Transaction {
  const amount = num(tx.amount) 
  const type: UiTxType = tx.type === "ADMIN_TOPUP" ? "deposit" : "purchase"

  return {
    id: tx.id,
    type,
    amount,
    description: buildDescription(tx),
    date: tx.createdAt,
    status: "completed",
  }
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [total, setTotal] = useState(0)

  const canLoadMore = useMemo(() => page * limit < total, [page, limit, total])

  useEffect(() => {
    if (!user?.id) return
    loadTransactions(1, true)
  }, [user?.id])

  async function loadTransactions(nextPage = 1, reset = false) {
    try {
      if (!user?.id) return
      setError("")
      setLoading(true)

      const res: BalanceHistoryResponse = await api.getBalanceHistory(user.id, nextPage, limit)

      const mapped = (res.items || []).map(mapTx)

      setTotal(res.total || 0)
      setPage(res.page || nextPage)

      if (reset) {
        setTransactions(mapped)
      } else {
        setTransactions((prev) => [...prev, ...mapped])
      }
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

  const balance = num((user as any)?.balance)

  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      if (tx.type !== "purchase") return sum
      const a = tx.amount
      return a < 0 ? sum + Math.abs(a) : sum + a
    }, 0)
  }, [transactions])

  const txCount = transactions.length

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
                  {fmtMoneyAZN(balance)}
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
                  {fmtMoneyAZN(totalSpent)}
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
                  {txCount}
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
              {loading && transactions.length === 0 ? (
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

                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      disabled={loading || !canLoadMore}
                      onClick={() => loadTransactions(page + 1, false)}
                      className="px-4 py-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? (locale === "az" ? "Yüklənir..." : locale === "ru" ? "Загрузка..." : "Loading...")
                        : canLoadMore
                          ? (locale === "az" ? "Daha çox yüklə" : locale === "ru" ? "Загрузить ещё" : "Load more")
                          : (locale === "az" ? "Hamısı yükləndi" : locale === "ru" ? "Всё загружено" : "All loaded")}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
