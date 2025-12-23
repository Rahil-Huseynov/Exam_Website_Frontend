"use client"

import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

export default function NewsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const news = [
    {
      id: 1,
      title:
        locale === "az"
          ? "Yeni universitetlər əlavə edildi"
          : locale === "ru"
            ? "Добавлены новые университеты"
            : "New universities added",
      description:
        locale === "az"
          ? "Platformaya 5 yeni universitet əlavə edildi. İndi daha çox imtahan seçimi var."
          : locale === "ru"
            ? "На платформу добавлено 5 новых университетов. Теперь доступно еще больше экзаменов."
            : "5 new universities have been added to the platform. More exam choices available now.",
      date: "2024-01-15",
      category: locale === "az" ? "Yenilik" : locale === "ru" ? "Новость" : "Update",
    },
    {
      id: 2,
      title:
        locale === "az"
          ? "Mobil tətbiq yaxında"
          : locale === "ru"
            ? "Мобильное приложение скоро"
            : "Mobile app coming soon",
      description:
        locale === "az"
          ? "Android və iOS üçün mobil tətbiqimiz hazırlanır. Hər yerdə imtahan verin!"
          : locale === "ru"
            ? "Мы разрабатываем мобильное приложение для Android и iOS. Сдавайте экзамены где угодно!"
            : "Our mobile app for Android and iOS is in development. Take exams anywhere!",
      date: "2024-01-10",
      category: locale === "az" ? "Elan" : locale === "ru" ? "Объявление" : "Announcement",
    },
    {
      id: 3,
      title:
        locale === "az"
          ? "Xüsusi endirimlər başladı"
          : locale === "ru"
            ? "Начались специальные скидки"
            : "Special discounts started",
      description:
        locale === "az"
          ? "Bütün imtahan paketlərində 30% endirim! Bu fürsəti qaçırmayın."
          : locale === "ru"
            ? "Скидка 30% на все пакеты экзаменов! Не упустите эту возможность."
            : "30% discount on all exam packages! Don't miss this opportunity.",
      date: "2024-01-05",
      category: locale === "az" ? "Aksiya" : locale === "ru" ? "Акция" : "Promotion",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t("news")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {locale === "az" && "Ən son yeniliklər və elanlar"}
              {locale === "en" && "Latest updates and announcements"}
              {locale === "ru" && "Последние обновления и объявления"}
            </p>
          </div>

          <div className="space-y-4">
            {news.map((item) => (
              <Card
                key={item.id}
                className="border-2 rounded-3xl shadow-xl backdrop-blur-sm bg-card/50 hover:shadow-2xl transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-balance text-xl">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className="bg-gradient-to-r from-primary via-secondary to-accent text-white border-0">
                      {item.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
