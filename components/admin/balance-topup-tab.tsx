"use client"

import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import { api } from "@/lib/api"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FoundUser = {
  id: number
  publicId: string
  email: string
  firstName?: string | null
  lastName?: string | null
  balance: string
  createdAt?: string
}

export function BalanceTopUpTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [publicId, setPublicId] = useState("")
  const [amount, setAmount] = useState("5")
  const [loading, setLoading] = useState(false)

  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null)

  const amountNum = useMemo(() => {
    const n = Number(String(amount).replace(",", "."))
    return Number.isFinite(n) ? n : NaN
  }, [amount])

  const pid = useMemo(() => publicId.trim().toUpperCase(), [publicId])

  const onSearch = async () => {
    if (!pid) return toast.error(t("errPublicIdRequired"))

    setSearching(true)
    try {
      const res = await api.adminGetUserByPublicId(pid)
      setFoundUser(res.user)
      toast.success(t("userFound"))
    } catch (e: any) {
      setFoundUser(null)
      toast.error(String(e?.message || t("userNotFound")))
    } finally {
      setSearching(false)
    }
  }

  const onSubmit = async () => {
    if (!pid) return toast.error(t("errPublicIdRequired"))
    if (!Number.isFinite(amountNum) || amountNum <= 0) return toast.error(t("errAmountInvalid"))

    if (!foundUser || foundUser.publicId !== pid) {
      return toast.error(t("errConfirmUserFirst"))
    }

    setLoading(true)
    try {
      const res = await api.adminTopUpByPublicId(pid, amountNum)
      toast.success(t("topUpSuccess", { added: res.added, balance: res.user.balance }))

      setFoundUser((prev) => (prev ? { ...prev, balance: res.user.balance } : prev))

      setAmount("5")
    } catch (e: any) {
      toast.error(String(e?.message || t("errGeneric")))
    } finally {
      setLoading(false)
    }
  }

  const displayName =
    foundUser && (foundUser.firstName || foundUser.lastName)
      ? `${foundUser.firstName ?? ""} ${foundUser.lastName ?? ""}`.trim()
      : t("noName")

  return (
    <Card className="border-purple-100 shadow-xl shadow-purple-100/50 backdrop-blur-sm bg-white/90">
      <CardHeader>
        <CardTitle className="text-lg">{t("balanceTopUpTitle")}</CardTitle>
        <CardDescription>{t("balanceTopUpDesc")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>{t("publicId")}</Label>

          <div className="flex gap-2">
            <Input
              value={publicId}
              onChange={(e) => {
                setPublicId(e.target.value)
                setFoundUser(null) 
              }}
              placeholder="U-12345678"
            />

            <Button
              type="button"
              variant="outline"
              onClick={onSearch}
              disabled={searching || !pid}
              className="shrink-0"
            >
              {searching ? t("searching") : t("search")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">{t("topUpHint")}</p>
        </div>
        {foundUser && (
          <div className="rounded-xl border border-purple-100 bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{displayName}</div>
              <div className="text-xs text-muted-foreground">{foundUser.publicId}</div>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">{t("emailLabel")}:</span> {foundUser.email}
              </div>
              <div>
                <span className="font-medium text-foreground">{t("balanceLabel")}:</span> {foundUser.balance}
              </div>
              {foundUser.createdAt && (
                <div>
                  <span className="font-medium text-foreground">{t("registeredLabel")}:</span>{" "}
                  {new Date(foundUser.createdAt).toLocaleString()}
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-green-700">{t("userConfirmedHint")}</div>
          </div>
        )}

        <div className="grid gap-2">
          <Label>{t("amount")}</Label>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="5"
          />
        </div>

        <Button disabled={loading} onClick={onSubmit} className="w-full">
          {loading ? t("sending") : t("topUpBtn")}
        </Button>
      </CardContent>
    </Card>
  )
}
