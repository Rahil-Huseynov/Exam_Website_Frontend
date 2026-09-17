"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import type { Locale } from "@/lib/i18n"

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(
  undefined
)

const LOCALES: Locale[] = ["az", "en", "ru"]

function getLocaleFromPathname(pathname: string): Locale {
  const firstSegment = pathname.split("/")[1]

  if (LOCALES.includes(firstSegment as Locale)) {
    return firstSegment as Locale
  }

  return "az"
}

function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return "/"
  }

  if (LOCALES.includes(segments[0] as Locale)) {
    segments.shift()
  }

  return segments.length > 0
    ? `/${segments.join("/")}`
    : "/"
}

export function LocaleProvider({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [locale, setLocaleState] = useState<Locale>(() =>
    getLocaleFromPathname(pathname || "/")
  )

  useEffect(() => {
    const urlLocale = getLocaleFromPathname(
      pathname || "/"
    )

    if (urlLocale !== locale) {
      setLocaleState(urlLocale)
    }

    document.documentElement.lang = urlLocale
  }, [pathname, locale])

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      return
    }

    const currentPath = removeLocaleFromPathname(
      pathname || "/"
    )

    const newPath =
      currentPath === "/"
        ? `/${newLocale}`
        : `/${newLocale}${currentPath}`

    setLocaleState(newLocale)

    router.push(newPath)
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)

  if (!ctx) {
    throw new Error(
      "useLocale must be used within a LocaleProvider"
    )
  }

  return ctx
}