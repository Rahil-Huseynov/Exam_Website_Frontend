"use client"

import Link from "next/link"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Instagram, InstagramIcon } from "lucide-react"

export function Footer() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const date = new Date();
  const year = date.getFullYear();
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <img className="w-40" src="/Logo.png" alt="İmtahanVer.net logosu" />
            <p className="text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center">
              <div>
                <a
                  href="https://www.instagram.com/azmiu.serbest_isler/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png" alt="Instagram" className="w-6 h-6 inline-block mr-2" />
                </a>
              </div>
              <div>
                <a
                  href="https://wa.me/994515593172"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/3840px-WhatsApp.svg.png" alt="WhatsApp" className="w-6 h-6 inline-block mr-2" />
                </a>
              </div>
            </div>
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
              <a href="tel:+994515593172" className="hover:text-primary transition-colors">
                +994 51 559 31 72
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {year} İmtahanVer.net. {t("footer.rights")}
        </div>
      </div>
    </footer>
  )
}
