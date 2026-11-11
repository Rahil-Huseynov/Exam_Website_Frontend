"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe, Menu, Wallet, LogOut, Shield, ArrowDownToLine } from "lucide-react"
import { fromCents, toCents } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle"
import { Capacitor } from "@capacitor/core"

export function Navbar() {
  const { user } = useAuth()
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation(locale)

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
    }
    window.location.href = `/${locale}/login`
  }

  const safeUser = user ?? {
    name: t("navbar.guest"),
    email: "",
    balance: 0,
    role: "client",
  }

  const displayName =
    (typeof safeUser?.name === "string" && safeUser.name.trim()) ||
    (typeof safeUser?.email === "string" && safeUser.email.trim()) ||
    t("navbar.guest")

  const initial = (displayName.trim()[0] || "U").toUpperCase()
  const balanceCents = toCents((safeUser as any)?.balance)

  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link
            href={`/${locale}/`}
            className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
          >
            <img className="w-30" src="/Logo.png" alt="İmtahanVer.net logosu" />
          </Link>
          <Link
            href={safeUser ? `/${locale}/dashboard` : `/${locale}/`}
            className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
          >
          </Link>

          <div className="hidden 2xl:flex items-center gap-2">
            <Link href={`/${locale}/dashboard`} className="px-4 py-2 text-sm font-medium rounded-full hover:bg-muted transition-colors">
              {t("home")}
            </Link>
            <Link href={`/${locale}/balance`} className="px-4 py-2 text-sm font-medium rounded-full hover:bg-muted transition-colors">
              {t("addBalance")}
            </Link>
            <Link href={`/${locale}/exams`} className="px-4 py-2 text-sm font-medium rounded-full hover:bg-muted transition-colors">
              {t("takeExam")}
            </Link>
            <Link href={`/${locale}/results`} className="px-4 py-2 text-sm font-medium rounded-full hover:bg-muted transition-colors">
              {t("examResults")}
            </Link>
            <Link href={`/${locale}/payments`} className="px-4 py-2 text-sm font-medium rounded-full hover:bg-muted transition-colors">
              {t("payments")}
            </Link>
            <Link href={`/${locale}/news`} className="px-4 py-2 text-sm font-medium rounded-full hover:bg-muted transition-colors">
              {t("news")}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {initial}
                </div>
                <Link href={`/${locale}/profile`} className="text-sm font-medium">
                  {displayName}
                </Link>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-accent" />
                <span className="text-sm font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {fromCents(balanceCents)} AZN
                </span>
              </div>
            </div>

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
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="2xl:hidden rounded-full">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <div className="md:hidden px-3 py-3 border-b mb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{displayName}</div>
                        <div className="text-xs text-muted-foreground">{safeUser.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10">
                      <Wallet className="h-4 w-4 text-accent" />
                      <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {fromCents(balanceCents)} AZN
                      </span>
                    </div>
                  </div>

                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/${locale}/dashboard`}>{t("home")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/${locale}/balance`}>{t("addBalance")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/${locale}/exams`}>{t("takeExam")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/${locale}/results`}>{t("examResults")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/${locale}/payments`}>{t("payments")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/${locale}/news`}>{t("news")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/${locale}/profile`}>{t("profile")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href={`/${locale}/contact`}>{t("contact")}</Link>
                  </DropdownMenuItem>

                  {(safeUser.role === "admin" || safeUser.role === "superadmin") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {t("admin")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2 rounded-xl cursor-pointer text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(safeUser.role === "admin" || safeUser.role === "superadmin") && (
                <Button
                  asChild
                  variant="outline"
                  className="hidden 2xl:inline-flex rounded-full border-primary/30 hover:bg-primary/10 bg-transparent"
                >
                  <Link href={`/${locale}/admin`} className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t("admin")}
                  </Link>
                </Button>
              )}

              <Button
                onClick={logout}
                variant="outline"
                className="hidden 2xl:inline-flex rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 bg-transparent cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("logout")}
              </Button>
            </>
          </div>
        </div>
      </div>
    </nav>
  )
}
