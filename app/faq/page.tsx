"use client"

import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { PublicNavbar } from "@/components/public-navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

export default function FAQPage() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const faqs = [
    { question: t("faqQ1"), answer: t("faqA1") },
    { question: t("faqQ2"), answer: t("faqA2") },
    { question: t("faqQ3"), answer: t("faqA3") },
    { question: t("faqQ4"), answer: t("faqA4") },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 flex flex-col">
      <PublicNavbar />

      <main className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t("faqTitle")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {locale === "az"
                ? "Ən çox verilən sualların cavabları"
                : locale === "en"
                  ? "Answers to the most common questions"
                  : "Ответы на самые частые вопросы"}
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card
                key={idx}
                className="p-8 rounded-3xl border-2 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-bold">{faq.question}</h3>
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-8 rounded-3xl border-2 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold">
                {locale === "az"
                  ? "Hələ də sualınız var?"
                  : locale === "en"
                    ? "Still have questions?"
                    : "Всё ещё есть вопросы?"}
              </h3>
              <p className="text-muted-foreground">
                {locale === "az"
                  ? "Bizimlə əlaqə saxlayın və sizə kömək edək!"
                  : locale === "en"
                    ? "Contact us and we'll help you!"
                    : "Свяжитесь с нами, и мы поможем!"}
              </p>
              <a
                href="/contact"
                className="inline-block mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {t("contact")}
              </a>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
