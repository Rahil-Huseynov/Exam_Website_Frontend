import type { Metadata } from "next"
import { headers } from "next/headers"

import NewsDetailClient from "./news-detail-client"

const SITE_URL = "https://imtahanver.net"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || ""

const IMAGE_URL =
  process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE ||
  API_URL

const LOCALES = ["az", "en", "ru"] as const

type Locale = (typeof LOCALES)[number]

type NewsItem = {
  id: string
  title: string
  content: string
  imageUrl?: string | null
  isPublished: boolean
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
  lang: Locale
}

function normalizeLocale(
  value: string | null
): Locale {
  if (
    value === "az" ||
    value === "en" ||
    value === "ru"
  ) {
    return value
  }

  return "az"
}

function getImageUrl(
  imageUrl?: string | null
): string {
  if (!imageUrl) {
    return `${SITE_URL}/og-image.png`
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl
  }

  return `${IMAGE_URL}${
    imageUrl.startsWith("/") ? "" : "/"
  }${imageUrl}`
}

function getDescription(
  content?: string
): string {
  if (!content) {
    return "İmtahanVer.net xəbərləri"
  }

  const text = content
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim()

  if (!text) {
    return "İmtahanVer.net xəbərləri"
  }

  return text.slice(0, 160)
}

async function getNews(
  id: string,
  locale: Locale
): Promise<NewsItem | null> {
  if (!API_URL) {
    return null
  }

  try {
    const response = await fetch(
      `${API_URL}/news/${encodeURIComponent(
        id
      )}?lang=${locale}`,
      {
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data?.title) {
      return null
    }

    return data as NewsItem
  } catch {
    return null
  }
}

function getAlternateLanguages(
  id: string
) {
  const encodedId = encodeURIComponent(id)

  return {
    az: `${SITE_URL}/az/news/${encodedId}`,
    en: `${SITE_URL}/en/news/${encodedId}`,
    ru: `${SITE_URL}/ru/news/${encodedId}`,
    "x-default":
      `${SITE_URL}/az/news/${encodedId}`,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const requestHeaders = await headers()

  const locale = normalizeLocale(
    requestHeaders.get("x-locale")
  )

  const encodedId = encodeURIComponent(id)

  const canonicalUrl =
    `${SITE_URL}/${locale}/news/${encodedId}`

  const alternateLanguages =
    getAlternateLanguages(id)

  const news = await getNews(id, locale)

  /*
   * News not found
   */
  if (!news) {
    const title =
      locale === "en"
        ? "News | İmtahanVer.net"
        : locale === "ru"
          ? "Новости | İmtahanVer.net"
          : "Xəbər | İmtahanVer.net"

    const description =
      locale === "en"
        ? "News from İmtahanVer.net."
        : locale === "ru"
          ? "Новости İmtahanVer.net."
          : "İmtahanVer.net xəbərləri."

    return {
      metadataBase: new URL(SITE_URL),

      title,

      description,

      alternates: {
        canonical: canonicalUrl,
        languages: alternateLanguages,
      },

      robots: {
        index: false,
        follow: true,
      },
    }
  }

  const description =
    getDescription(news.content)

  const imageUrl =
    getImageUrl(news.imageUrl)

  const localeMap = {
    az: "az_AZ",
    en: "en_US",
    ru: "ru_RU",
  } as const

  return {
    metadataBase: new URL(SITE_URL),

    /*
     * Title
     */
    title: news.title,

    /*
     * Description
     */
    description,

    /*
     * Canonical + hreflang
     */
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },

    /*
     * Robots
     */
    robots: {
      index: news.isPublished,
      follow: true,

      googleBot: {
        index: news.isPublished,
        follow: true,
        noimageindex: false,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },

    /*
     * Open Graph
     */
    openGraph: {
      type: "article",

      title: news.title,

      description,

      url: canonicalUrl,

      siteName: "İmtahanVer.net",

      locale: localeMap[locale],

      publishedTime:
        news.publishedAt ||
        news.createdAt,

      modifiedTime:
        news.updatedAt,

      images: [
        {
          url: imageUrl,
          alt: news.title,
        },
      ],
    },

    /*
     * Twitter / X
     */
    twitter: {
      card: "summary_large_image",

      title: news.title,

      description,

      images: [imageUrl],
    },
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const requestHeaders = await headers()

  const locale = normalizeLocale(
    requestHeaders.get("x-locale")
  )

  const news = await getNews(id, locale)

  /*
   * If the news does not exist,
   * let the client component display
   * the not-found UI.
   */
  if (!news) {
    return <NewsDetailClient />
  }

  const encodedId = encodeURIComponent(id)

  const pageUrl =
    `${SITE_URL}/${locale}/news/${encodedId}`

  const imageUrl =
    getImageUrl(news.imageUrl)

  const description =
    getDescription(news.content)

  /*
   * NewsArticle structured data
   *
   * This is rendered server-side so that
   * search engines can receive it in the
   * initial HTML response.
   */
  const newsJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",

    "@id":
      `${pageUrl}#newsarticle`,

    headline: news.title,

    description,

    url: pageUrl,

    datePublished:
      news.publishedAt ||
      news.createdAt,

    dateModified:
      news.updatedAt,

    inLanguage: locale,

    isAccessibleForFree: true,

    author: {
      "@type": "Organization",

      name: "İmtahanVer.net",

      url: SITE_URL,
    },

    publisher: {
      "@type": "Organization",

      name: "İmtahanVer.net",

      url: SITE_URL,

      logo: {
        "@type": "ImageObject",

        url:
          `${SITE_URL}/favicon.png`,
      },
    },

    image: [imageUrl],

    mainEntityOfPage: {
      "@type": "WebPage",

      "@id":
        `${pageUrl}#webpage`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(newsJsonLd),
        }}
      />

      <NewsDetailClient />
    </>
  )
}