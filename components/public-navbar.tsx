"use client"

import Link from "next/link"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Menu } from "lucide-react"
import { useState } from "react"

export function PublicNavbar() {
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
          >
            ExamPro
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium hover:text-primary transition-colors">
              {t("features")}
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              {t("about")}
            </Link>
            <Link href="/faq" className="text-sm font-medium hover:text-primary transition-colors">
              {t("faq")}
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              {t("contact")}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl">
                <DropdownMenuItem onClick={() => setLocale("az")} className="rounded-xl cursor-pointer">
                  {t("navbar.lang.az")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")} className="rounded-xl cursor-pointer">
                  {t("navbar.lang.en")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ru")} className="rounded-xl cursor-pointer">
                  {t("navbar.lang.ru")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild variant="ghost" className="rounded-full hidden md:flex">
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity hidden md:flex"
            >
              <Link href="/register">{t("register")}</Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-2">
            <Link href="/#features" className="text-sm font-medium hover:text-primary transition-colors py-2">
              {t("features")}
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors py-2">
              {t("about")}
            </Link>
            <Link href="/faq" className="text-sm font-medium hover:text-primary transition-colors py-2">
              {t("faq")}
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors py-2">
              {t("contact")}
            </Link>
            <div className="flex gap-2 pt-2">
              <Button asChild variant="ghost" className="rounded-full flex-1">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity flex-1"
              >
                <Link href="/register">{t("register")}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
