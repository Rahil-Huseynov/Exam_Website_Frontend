"use client"

import Link from "next/link"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

export function Footer() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <img className="w-40" src="/Logo.png" alt="İmtahanVer.net logosu" />
            <p className="text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">{t("footer.pages")}</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                {t("about")}
              </Link>
              <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                {t("faq")}
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                {t("contact")}
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">{t("footer.legal")}</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                {t("terms")}
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                {t("privacy")}
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">{t("footer.contact")}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="mailto:info@imtahanver.net" className="hover:text-primary transition-colors">
                info@imtahanver.net
              </a>
              <a href="tel:+994501234567" className="hover:text-primary transition-colors">
                +994 50 123 45 67
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © 2025 İmtahanVer.net. {t("footer.rights")}
        </div>
      </div>
    </footer>
  )
}
