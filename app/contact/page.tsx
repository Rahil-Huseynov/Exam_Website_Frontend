"use client"

import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin, Send } from "lucide-react"

export default function ContactPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}

      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t("contact")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {locale === "az" && "Bizimlə əlaqə saxlayın, sizə kömək etməyə hazırıq"}
              {locale === "en" && "Get in touch with us, we're here to help"}
              {locale === "ru" && "Свяжитесь с нами, мы готовы помочь"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">
                  {locale === "az" && "Mesaj göndərin"}
                  {locale === "en" && "Send a message"}
                  {locale === "ru" && "Отправить сообщение"}
                </CardTitle>
                <CardDescription>
                  {locale === "az" && "Formu doldurun və biz sizinlə əlaqə saxlayacağıq"}
                  {locale === "en" && "Fill out the form and we'll get back to you"}
                  {locale === "ru" && "Заполните форму и мы свяжемся с вами"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {locale === "az" && "Ad"}
                    {locale === "en" && "Name"}
                    {locale === "ru" && "Имя"}
                  </Label>
                  <Input
                    id="name"
                    className="rounded-2xl h-12"
                    placeholder={locale === "az" ? "Adınız" : locale === "en" ? "Your name" : "Ваше имя"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" className="rounded-2xl h-12" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">
                    {locale === "az" && "Mesaj"}
                    {locale === "en" && "Message"}
                    {locale === "ru" && "Сообщение"}
                  </Label>
                  <Textarea
                    id="message"
                    className="rounded-2xl min-h-32"
                    placeholder={
                      locale === "az"
                        ? "Mesajınızı yazın..."
                        : locale === "en"
                          ? "Write your message..."
                          : "Напишите ваше сообщение..."
                    }
                  />
                </div>
                <Button className="w-full rounded-full h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity">
                  <Send className="w-4 h-4 mr-2" />
                  {locale === "az" && "Göndər"}
                  {locale === "en" && "Send"}
                  {locale === "ru" && "Отправить"}
                </Button>
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
                      <p className="font-semibold text-lg">Email</p>
                      <a href="mailto:info@exampro.com" className="text-sm text-muted-foreground hover:text-primary">
                        info@exampro.com
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
                      <p className="font-semibold text-lg">
                        {locale === "az" && "Telefon"}
                        {locale === "en" && "Phone"}
                        {locale === "ru" && "Телефон"}
                      </p>
                      <a href="tel:+994501234567" className="text-sm text-muted-foreground hover:text-primary">
                        +994 50 123 45 67
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
                      <p className="font-semibold text-lg">
                        {locale === "az" && "Ünvan"}
                        {locale === "en" && "Address"}
                        {locale === "ru" && "Адрес"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {locale === "az" && "Bakı, Azərbaycan"}
                        {locale === "en" && "Baku, Azerbaijan"}
                        {locale === "ru" && "Баку, Азербайджан"}
                      </p>
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
