"use client"

import * as React from "react"
import { toast } from "react-toastify"

import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { api } from "@/lib/api"

import { Navbar } from "@/components/navbar"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react"

function formatAzPhoneDigits(digitsOnly: string) {
  const d = digitsOnly.replace(/\D/g, "").slice(0, 9)

  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
}

export default function ContactPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phoneDigits, setPhoneDigits] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)

  React.useEffect(() => {
    const anyUser = user as any
    const fullName =
      (typeof anyUser?.name === "string" && anyUser.name.trim()) ||
      `${(anyUser?.firstName || "").toString()} ${(anyUser?.lastName || "").toString()}`.trim()

    if (fullName && !name) setName(fullName)
    if (typeof anyUser?.email === "string" && anyUser.email.trim() && !email) setEmail(anyUser.email.trim())
  }, [user])

  const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

  const formattedPhone = formatAzPhoneDigits(phoneDigits)
  const fullPhone = phoneDigits ? `+994 ${formattedPhone}` : "+994"
  const isPhoneValid = phoneDigits.length === 9

  const canSend =
    name.trim().length >= 2 &&
    isEmailValid(email) &&
    isPhoneValid &&
    message.trim().length >= 5 &&
    !isSending

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSending) return

    const n = name.trim()
    const em = email.trim()
    const msg = message.trim()

    if (n.length < 2) {
      toast.error(t("contact.toast.err_name_min"))
      return
    }
    if (!isEmailValid(em)) {
      toast.error(t("contact.toast.err_email"))
      return
    }
    if (!isPhoneValid) {
      toast.error(t("contact.toast.err_phone_format"))
      return
    }
    if (msg.length < 5) {
      toast.error(t("contact.toast.err_message_min"))
      return
    }

    setIsSending(true)
    const toastId = "contact-send"

    try {
      toast.loading(t("contact.toast.sending"), { toastId })

      await api.sendContact({
        name: n,
        email: em,
        phone: fullPhone,
        message: msg,
      })

      toast.update(toastId, {
        render: t("contact.toast.success"),
        type: "success",
        isLoading: false,
        autoClose: 3500,
      })

      setMessage("")
      setPhoneDigits("")
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message

      const safeMsg =
        typeof rawMsg === "string"
          ? rawMsg
          : Array.isArray(rawMsg)
            ? rawMsg[0]
            : t("contact.toast.fail")

      toast.update(toastId, {
        render: safeMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}

      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t("contact")}
            </h1>
            <p className="text-lg text-muted-foreground">{t("contactSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">{t("contactSendTitle")}</CardTitle>
                <CardDescription>{t("contactSendDesc")}</CardDescription>
              </CardHeader>

              <CardContent className="px-0 space-y-4">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("contactNameLabel")}</Label>
                    <Input
                      id="name"
                      className="rounded-2xl h-12"
                      placeholder={t("contactNamePlaceholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSending}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      className="rounded-2xl h-12"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSending}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("contactPhoneLabel")}</Label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pr-3 rounded-l-2xl bg-muted border-r text-sm font-semibold text-muted-foreground select-none">
                        +994
                      </div>

                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        className="pl-20 rounded-2xl h-12 tracking-wide"
                        placeholder={t("contact.phone.placeholder")}
                        value={formattedPhone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "")
                          setPhoneDigits(digits.slice(0, 9))
                        }}
                        disabled={isSending}
                        autoComplete="tel"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {t("contact.phone.example_label")}{" "}
                        <span className="font-medium">{t("contact.phone.example_value")}</span>
                      </span>

                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t("contactMessageLabel")}</Label>
                    <Textarea
                      id="message"
                      maxLength={2000}
                      className="rounded-2xl h-32 max-h-32 resize-none overflow-y-auto"
                      placeholder={t("contactMessagePlaceholder")}
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                      disabled={isSending}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{message.trim().length}/2000</span>
                      {message.trim().length >= 5 ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> {t("contact.message.ok")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!canSend}
                    className="w-full rounded-full h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {isSending ? t("contact.toast.sending_btn") : t("contactSendBtn")}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{t("email")}</p>
                      <a href="mailto:info@imtahanver.net" className="text-sm text-muted-foreground hover:text-primary">
                        info@imtahanver.net
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{t("contactPhoneLabel")}</p>
                      <a href="tel:+994515593172" className="text-sm text-muted-foreground hover:text-primary">
                        +994 51 559 31 72
                      </a>
                      <a href="tel:+994123456789" className="text-sm text-muted-foreground hover:text-primary">
                        +994123456789
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{t("contactAddressLabel")}</p>
                      <p className="text-sm text-muted-foreground">{t("contactAddressValue")}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
