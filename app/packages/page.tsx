"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap, Crown } from "lucide-react"

export default function PackagesPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const packages = [
    {
      id: 1,
      name: locale === "az" ? "Başlanğıc" : locale === "ru" ? "Начальный" : "Starter",
      price: 15,
      features:
        locale === "az"
          ? ["5 imtahan", "30 gün keçərlidir", "Əsas dəstək"]
          : locale === "ru"
            ? ["5 экзаменов", "Действителен 30 дней", "Базовая поддержка"]
            : ["5 exams", "Valid for 30 days", "Basic support"],
    },
    {
      id: 2,
      name: locale === "az" ? "Populyar" : locale === "ru" ? "Популярный" : "Popular",
      price: 40,
      popular: true,
      features:
        locale === "az"
          ? ["15 imtahan", "60 gün keçərlidir", "Prioritet dəstək", "10% endirim"]
          : locale === "ru"
            ? ["15 экзаменов", "Действителен 60 дней", "Приоритетная поддержка", "Скидка 10%"]
            : ["15 exams", "Valid for 60 days", "Priority support", "10% discount"],
    },
    {
      id: 3,
      name: locale === "az" ? "Premium" : locale === "ru" ? "Премиум" : "Premium",
      price: 99,
      features:
        locale === "az"
          ? ["Limitsiz imtahan", "1 il keçərlidir", "Premium dəstək", "20% endirim", "Eksklüziv məzmun"]
          : locale === "ru"
            ? ["Безлимитные экзамены", "Действителен 1 год", "Премиум поддержка", "Скидка 20%", "Эксклюзивный контент"]
            : ["Unlimited exams", "Valid for 1 year", "Premium support", "20% discount", "Exclusive content"],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
              {t("examPackages")}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {locale === "az" &&
                "İmtahan paketləri ilə daha çox qənaət edin. Sizə uyğun paketi seçin və hazırlığa başlayın."}
              {locale === "en" &&
                "Save more with exam packages. Choose the package that suits you and start preparing."}
              {locale === "ru" &&
                "Экономьте больше с пакетами экзаменов. Выберите подходящий пакет и начните подготовку."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {packages.map((pkg, idx) => {
              const icons = [Zap, Star, Crown]
              const Icon = icons[idx]

              return (
                <Card
                  key={pkg.id}
                  className={`relative flex flex-col backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-2 shadow-2xl transition-all hover:-translate-y-2 ${pkg.popular ? "border-violet-400 scale-105" : "border-white/20"}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold shadow-lg flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current" />
                      {locale === "az" ? "Ən Populyar" : locale === "ru" ? "Самый популярный" : "Most Popular"}
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl mb-2">{pkg.name}</CardTitle>
                    <CardDescription className="text-center">
                      <div className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                        {pkg.price}
                      </div>
                      <span className="text-muted-foreground text-lg">AZN</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-4">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <Check className="h-4 w-4 text-white font-bold" />
                          </div>
                          <span className="text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-6">
                    <Button
                      asChild
                      className={`w-full h-12 text-base ${pkg.popular ? "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700" : "border-2"}`}
                      variant={pkg.popular ? "default" : "outline"}
                    >
                      <Link href="/balance">
                        {locale === "az" ? "Paketi al" : locale === "ru" ? "Купить пакет" : "Buy Package"}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
