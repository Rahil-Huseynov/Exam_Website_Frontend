"use client"

import Link from "next/link"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDownToLine, Globe, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { ThemeToggle } from "./ThemeToggle"
import { Capacitor } from "@capacitor/core"

export function PublicNavbar() {
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const openMobile = () => {
    setIsMounted(true)
    requestAnimationFrame(() => setMobileMenuOpen(true))
  }

  const closeMobile = () => setMobileMenuOpen(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile()
    }
    window.addEventListener("keydown", onKeyDown)

    if (mobileMenuOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link
            href={`/${locale}/`}
            className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            style={{ visibility: mobileMenuOpen ? "hidden" : "visible" }}
            onClick={closeMobile}
          >
            <img className="w-40" src="/Logo.png" alt="İmtahanVer.net logosu" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden xl:flex items-center gap-8">
            <Link href={`/${locale}/#`} className="text-sm font-medium hover:text-primary transition-colors">
              {t("home")}
            </Link>
            <Link href={`/${locale}/#features`} className="text-sm font-medium hover:text-primary transition-colors">
              {t("features")}
            </Link>
            <Link href={`/${locale}/about`} className="text-sm font-medium hover:text-primary transition-colors">
              {t("about")}
            </Link>
            <Link href={`/${locale}/exams`} className="px-4 py-2 text-sm font-medium rounded-full hover:bg-muted transition-colors">
              {t("takeExam")}
            </Link>
            <Link href={`/${locale}/faq`} className="text-sm font-medium hover:text-primary transition-colors">
              {t("faq")}
            </Link>
            <Link href={`/${locale}/news`} className="text-sm font-medium hover:text-primary transition-colors">
              {t("news")}
            </Link>
            <Link href={`/${locale}/contact`} className="text-sm font-medium hover:text-primary transition-colors">
              {t("contact")}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full cursor-pointer">
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

            <ThemeToggle />
            {!Capacitor.isNativePlatform() && (
              <Link
                href={`/${locale}/download`}
                aria-label="Download app"
                title="Download app"
                className="group inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-95"
              >
                <ArrowDownToLine className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5" />
              </Link>
            )}
            <Button asChild variant="ghost" className="rounded-full hidden xl:flex">
              <Link href={`/${locale}/login`}>{t("login")}</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity hidden xl:flex"
            >
              <Link href={`/${locale}/register`}>{t("register")}</Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden rounded-full cursor-pointer"
              onClick={openMobile}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (mount + close animation, then display none) */}
      {isMounted && (
        <div
          className={[
            "fixed inset-0 z-50 xl:hidden",
            mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none",
          ].join(" ")}
          aria-hidden={!mobileMenuOpen}
        >
          {/* Overlay */}
          <div
            className={[
              "absolute inset-0 transition-opacity duration-300",
              mobileMenuOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onClick={closeMobile}
          />

          {/* Panel */}
          <div
            className={[
              "absolute inset-y-0 right-0 w-64 bg-card shadow-lg",
              "transform transition-transform duration-300 ease-in-out", "overflow-y-auto",
              mobileMenuOpen ? "translate-x-0" : "translate-x-full",
            ].join(" ")}
            style={{ height: "100dvh" }}
            onClick={(e) => e.stopPropagation()}
            onTransitionEnd={() => {
              if (!mobileMenuOpen) setIsMounted(false)
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="py-6">
              <div className="flex justify-between items-center px-4">
                <Link
                  href={`/${locale}/`}
                  className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
                  onClick={closeMobile}
                >
                  <img className="w-30" src="/Logo.png" alt="İmtahanVer.net logosu" />
                </Link>

                <Button className="cursor-pointer" variant="ghost" size="icon" onClick={closeMobile} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="bg-[#E3E4EB] w-full h-[1px] mt-5"></div>
            </div>
            <div className="flex flex-col gap-8 px-4">
              <Link
                href={`/${locale}/`}
                className="text-lg font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobile}
              >
                {t("home")}
              </Link>
              <Link
                href={`/${locale}/#features`}
                className="text-lg font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobile}
              >
                {t("features")}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="text-lg font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobile}
              >
                {t("about")}
              </Link>
              <Link
                href={`/${locale}/exams`}
                className="text-lg font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobile}
              >
                {t("takeExam")}
              </Link>
              <Link
                href={`/${locale}/faq`}
                className="text-lg font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobile}
              >
                {t("faq")}
              </Link>
              <Link
                href={`/${locale}/news`}
                className="text-lg font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobile}
              >
                {t("news")}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="text-lg font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobile}
              >
                {t("contact")}
              </Link>

              <div className="grid gap-4 pt-2">
                <Button asChild variant="ghost" className="rounded-full flex-1">
                  <Link href={`/${locale}/login`} onClick={closeMobile}>
                    {t("login")}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity flex-1"
                >
                  <Link href={`/${locale}/register`} onClick={closeMobile}>
                    {t("register")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
