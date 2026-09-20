"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import {
  usePathname,
  useRouter,
} from "next/navigation"

import type { Locale } from "@/lib/i18n"

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext =
  createContext<
    LocaleContextType | undefined
  >(undefined)

const LOCALES: Locale[] = [
  "az",
  "en",
  "ru",
]

function getLocaleFromPathname(
  pathname: string
): Locale {
  const firstSegment =
    pathname
      .split("/")
      .filter(Boolean)[0]

  if (
    firstSegment === "az" ||
    firstSegment === "en" ||
    firstSegment === "ru"
  ) {
    return firstSegment
  }

  return "az"
}

function removeLocaleFromPathname(
  pathname: string
): string {
  const segments =
    pathname
      .split("/")
      .filter(Boolean)

  if (
    segments.length > 0 &&
    LOCALES.includes(
      segments[0] as Locale
    )
  ) {
    segments.shift()
  }

  if (segments.length === 0) {
    return "/"
  }

  return `/${segments.join("/")}`
}

export function LocaleProvider({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  /*
   * URL-dən ilkin dili götürürük.
   */
  const [locale, setLocaleState] =
    useState<Locale>(() =>
      getLocaleFromPathname(
        pathname || "/"
      )
    )

  /*
   * URL dəyişəndə locale-i yenilə.
   */
  useEffect(() => {
    const currentPath =
      pathname || "/"

    const detectedLocale =
      getLocaleFromPathname(
        currentPath
      )

    setLocaleState(
      detectedLocale
    )

    document.documentElement.lang =
      detectedLocale
  }, [pathname])

  /*
   * Dil dəyişdirildikdə URL-də locale
   * qorunur.
   *
   * /az/exams
   *      ↓
   * /en/exams
   *
   * /ru/news
   *      ↓
   * /en/news
   */
  const setLocale = (
    newLocale: Locale
  ) => {
    if (newLocale === locale) {
      return
    }

    const currentPath =
      removeLocaleFromPathname(
        pathname || "/"
      )

    const newPath =
      currentPath === "/"
        ? `/${newLocale}`
        : `/${newLocale}${currentPath}`

    setLocaleState(
      newLocale
    )

    document.documentElement.lang =
      newLocale

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
  const context =
    useContext(LocaleContext)

  if (!context) {
    throw new Error(
      "useLocale must be used within a LocaleProvider"
    )
  }

  return context
}