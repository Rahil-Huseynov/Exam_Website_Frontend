"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProfileResp = {
  id: number
  email: string
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  publicId?: string | null
  balance?: any
  createdAt?: string
}

export default function ProfilePage() {
  const { refreshUser, logout } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const [me, setMe] = useState<ProfileResp | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  const displayName = useMemo(() => {
    const fn = (me?.firstName || "").trim()
    const ln = (me?.lastName || "").trim()
    const full = `${fn} ${ln}`.trim()
    return full || me?.email || "User"
  }, [me])

  const load = async () => {
    setLoading(true)
    try {
      const data = (await api.getProfile()) as any
      const user: ProfileResp = data?.user ? data.user : data
      setMe(user)

      setFirstName(String(user?.firstName ?? ""))
      setLastName(String(user?.lastName ?? ""))
      setEmail(String(user?.email ?? ""))

      try {
        await refreshUser()
      } catch {}
    } catch (e: any) {
      toast.error(e?.message || t("errDataLoad") || "Məlumatlar yüklənmədi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveProfile = async () => {
    if (!me?.id) return toast.error(t("errGeneric") || "Xəta baş verdi")

    const fn = firstName.trim()
    const ln = lastName.trim()
    const em = email.trim().toLowerCase()

    if (!em) return toast.error(t("errEmailRequired") || "Email daxil edin")

    setSaving(true)
    try {
      await api.updateUser(me.id, { firstName: fn || undefined, lastName: ln || undefined, email: em })
      toast.success(t("profileUpdated") || "Profil uğurla yeniləndi")
      await load()
    } catch (e: any) {
      toast.error(e?.message || t("errUpdateFailed") || "Yeniləmə alınmadı")
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    const cur = currentPassword
    const np = newPassword
    const cp = confirmNewPassword

    if (!cur) return toast.error(t("profileErrCurrentPasswordRequired") || "Cari şifrəni yaz")
    if (!np || np.length < 6) return toast.error(t("errPasswordTooShort") || "Şifrə ən azı 6 simvol olmalıdır")
    if (np !== cp) return toast.error(t("errPasswordsMismatch") || "Şifrələr uyğun gəlmir")

    setPwLoading(true)
    try {
      const res = await api.changePassword(cur, np)
      toast.success(res?.message || t("passwordUpdated") || "Şifrə uğurla dəyişdirildi")

      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (e: any) {
      toast.error(e?.message || t("profileErrPasswordUpdateFailed") || "Şifrə yenilənmədi")
    } finally {
      setPwLoading(false)
    }
  }

  const doLogout = async () => {
    try {
      await logout()
    } catch (e: any) {
      toast.error(e?.message || t("errGeneric") || "Xəta baş verdi")
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{t("profileTitle") || t("profile") || "Profil"}</h1>
            <p className="text-muted-foreground">
              {t("profileSubtitle") || "Hesab məlumatlarını yenilə və şifrəni dəyiş."}
            </p>
          </div>

          <Button variant="outline" onClick={doLogout}>
            {t("logout") || "Çıxış"}
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">{t("loading") || "Yüklənir..."}</CardContent>
          </Card>
        ) : !me ? (
          <Card>
            <CardContent className="p-6">{t("profileNotFound") || "Profil tapılmadı"}</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("profileOverview") || "Ümumi məlumat"}</CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t("name") || "Ad"}</div>
                  <div className="font-semibold">{displayName}</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t("publicIdLabel") || t("publicId") || "Public ID"}</div>
                  <div className="font-semibold">{me.publicId || "-"}</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{t("balance") || "Balans"}</div>
                  <div className="font-semibold">
                    {typeof me.balance === "string" || typeof me.balance === "number" ? String(me.balance) : "0.00"}
                  </div>
                </div>

                <div className="rounded-lg border p-4 md:col-span-3">
                  <div className="text-sm text-muted-foreground">{t("email") || "Email"}</div>
                  <div className="font-semibold">{me.email}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("profileEdit") || "Profil məlumatlarını dəyiş"}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("firstNameLabel") || t("firstName") || "Ad"}</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("firstName") || "Ad"} />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("lastNameLabel") || t("lastName") || "Soyad"}</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("lastName") || "Soyad"} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("emailLabel") || t("email") || "Email"}</Label>
                  <Input disabled value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                </div>

                <Button onClick={saveProfile} disabled={saving} className="w-full">
                  {saving ? (t("saving") || t("exams.ui.saving") || "Yadda saxlanır...") : (t("save") || "Yadda saxla")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("changePasswordTitle") || "Şifrəni dəyiş"}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("currentPasswordLabel") || "Cari şifrə"}</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("newPasswordLabel") || "Yeni şifrə"}</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("confirmNewPasswordLabel") || "Yeni şifrə (təkrar)"}</Label>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button onClick={changePassword} disabled={pwLoading} className="w-full">
                  {pwLoading ? (t("loading") || "Yüklənir...") : (t("updatePasswordBtn") || "Şifrəni yenilə")}
                </Button>

                <p className="text-xs text-muted-foreground">{t("passwordHint") || "Tövsiyə: ən az 6 simvol..."}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
