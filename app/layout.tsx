import type React from "react"
import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Geist, Geist_Mono } from "next/font/google"

import { AuthProvider } from "@/contexts/auth-context"
import { LocaleProvider } from "@/contexts/locale-context"

import "./globals.css"

import { ToastContainer } from "react-toastify"

import { MaintenanceWatcher } from "@/components/MaintenanceWatcher"
import MaintenanceClient from "@/components/MaintenanceClient"
import { MaintenanceGuard } from "@/components/MaintenanceGuard"
import { ThemeProvider } from "@/components/theme-provider"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
})

const SITE_URL = "https://imtahanver.net"

const LOCALES = ["az", "en", "ru"] as const

type Locale = (typeof LOCALES)[number]

const LOCALE_DATA: Record<
  Locale,
  {
    htmlLang: string
    ogLocale: string
    title: string
    description: string
  }
> = {
  az: {
    htmlLang: "az",
    ogLocale: "az_AZ",
    title: "İmtahanVer.net | Onlayn İmtahan Platforması",
    description:
      "İmtahanVer.net universitet, magistratura, doktorantura və digər imtahanlara hazırlaşmaq üçün müasir onlayn platformadır.",
  },

  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    title: "İmtahanVer.net | Online Exam Platform",
    description:
      "İmtahanVer.net is an online platform for preparing for university, master's, PhD and other exams.",
  },

  ru: {
    htmlLang: "ru",
    ogLocale: "ru_RU",
    title: "İmtahanVer.net | Онлайн-платформа для экзаменов",
    description:
      "İmtahanVer.net — онлайн-платформа для подготовки к университетским, магистерским, докторским и другим экзаменам.",
  },
}

function normalizeLocale(value: string | null): Locale {
  if (
    value === "az" ||
    value === "en" ||
    value === "ru"
  ) {
    return value
  }

  return "az"
}

function getPathWithoutLocale(
  pathname: string,
  locale: Locale
): string {
  const prefix = `/${locale}`

  if (pathname === prefix) {
    return "/"
  }

  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length) || "/"
  }

  return pathname || "/"
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()

  const locale = normalizeLocale(
    requestHeaders.get("x-locale")
  )

  const pathname =
    requestHeaders.get("x-original-pathname") || `/${locale}`

  const data = LOCALE_DATA[locale]

  const pathWithoutLocale = getPathWithoutLocale(
    pathname,
    locale
  )

  const canonicalPath =
    pathWithoutLocale === "/"
      ? `/${locale}`
      : `/${locale}${pathWithoutLocale}`

  const canonicalUrl = `${SITE_URL}${canonicalPath}`

  const alternateLanguages = {
    az:
      pathWithoutLocale === "/"
        ? `${SITE_URL}/az`
        : `${SITE_URL}/az${pathWithoutLocale}`,

    en:
      pathWithoutLocale === "/"
        ? `${SITE_URL}/en`
        : `${SITE_URL}/en${pathWithoutLocale}`,

    ru:
      pathWithoutLocale === "/"
        ? `${SITE_URL}/ru`
        : `${SITE_URL}/ru${pathWithoutLocale}`,

    "x-default":
      pathWithoutLocale === "/"
        ? `${SITE_URL}/az`
        : `${SITE_URL}/az${pathWithoutLocale}`,
  }

  return {
    metadataBase: new URL(SITE_URL),

    title: {
      default: data.title,
      template: `%s | İmtahanVer.net`,
    },

    description: data.description,

    keywords: [
      "İmtahanVer",
      "İmtahanVer.net",
      "imtahan",
      "onlayn imtahan",
      "online exam",
      "imtahan platforması",
      "imtahan sistemi",
      "imtahan portalı",
      "imtahan hazırlığı",
      "test",
      "testlər",
      "onlayn test",
      "sınaq imtahanı",
      "onlayn sınaq imtahanı",
      "universitet",
      "universitet imtahanı",
      "ali təhsil",
      "bakalavr",
      "magistratura",
      "magistratura imtahanı",
      "magistratura testləri",
      "doktorantura",
      "doktorantura imtahanı",
      "Azərbaycan",
      "Azərbaycan təhsil",
      "DİM",
      "Dövlət İmtahan Mərkəzi",
      "təhsil",
      "education",
      "learning",
      "e-learning",
      "süni intellekt",
      "AI assessment",
      "imtahan nəticəsi",
      "qiymətləndirmə",
      "imtahan sualları",
      "imtahan testləri",
      "universitet testləri",
      "doktorantura sualları",
      "magistratura sualları",
    ],

    applicationName: "İmtahanVer.net",

    authors: [
      {
        name: "İmtahanVer.net",
        url: SITE_URL,
      },
    ],

    creator: "İmtahanVer.net",
    publisher: "İmtahanVer.net",
    category: "Education",

    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },

    openGraph: {
      type: "website",
      locale: data.ogLocale,
      siteName: "İmtahanVer.net",

      title: data.title,

      description: data.description,

      url: canonicalUrl,

      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 512,
          height: 512,
          alt: "İmtahanVer.net",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title: data.title,

      description: data.description,

      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 512,
          height: 512,
          alt: "İmtahanVer.net",
        },
      ],
    },

    icons: {
      icon: "/favicon.png",
      apple: "/favicon.png",
    },

    manifest: "/manifest.webmanifest",
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const requestHeaders = await headers()

  const locale = normalizeLocale(
    requestHeaders.get("x-locale")
  )

  const pathname =
    requestHeaders.get("x-original-pathname") ||
    `/${locale}`

  const pathWithoutLocale = getPathWithoutLocale(
    pathname,
    locale
  )

  const canonicalPath =
    pathWithoutLocale === "/"
      ? `/${locale}`
      : `/${locale}${pathWithoutLocale}`

  const canonicalUrl = `${SITE_URL}${canonicalPath}`

  const data = LOCALE_DATA[locale]

  const jsonLd = {
    "@context": "https://schema.org",

    "@graph": [
      {
        "@type": "Organization",

        "@id": `${SITE_URL}/#organization`,

        name: "İmtahanVer.net",

        url: SITE_URL,

        logo: {
          "@type": "ImageObject",

          "@id": `${SITE_URL}/#logo`,

          url: `${SITE_URL}/favicon.png`,

          contentUrl: `${SITE_URL}/favicon.png`,
        },
      },

      {
        "@type": "EducationalOrganization",

        "@id": `${SITE_URL}/#educational-organization`,

        name: "İmtahanVer.net",

        url: SITE_URL,

        description:
          "Universitet, magistratura, doktorantura və digər imtahanlara hazırlaşmaq üçün onlayn təhsil və sınaq imtahanı platforması.",

        logo: {
          "@id": `${SITE_URL}/#logo`,
        },
      },

      {
        "@type": "WebSite",

        "@id": `${SITE_URL}/#website`,

        name: "İmtahanVer.net",

        url: SITE_URL,

        description: data.description,

        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },

        inLanguage: locale,
      },

      {
        "@type": "WebPage",

        "@id": `${canonicalUrl}#webpage`,

        url: canonicalUrl,

        name: data.title,

        description: data.description,

        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },

        about: {
          "@id": `${SITE_URL}/#educational-organization`,
        },

        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },

        inLanguage: locale,
      },
    ],
  }

  return (
    <html lang={data.htmlLang} suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <AuthProvider>
              <MaintenanceClient />

              <MaintenanceWatcher />

              <MaintenanceGuard />

              {children}
            </AuthProvider>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              closeOnClick
              pauseOnHover
              draggable
            />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}