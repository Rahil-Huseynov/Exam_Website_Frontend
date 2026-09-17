import type { MetadataRoute } from "next"

const BASE_URL = "https://imtahanver.net"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || ""

const LOCALES = ["az", "en", "ru"] as const

type Locale = (typeof LOCALES)[number]

type PublicNewsItem = {
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

const PUBLIC_PAGES = [
  {
    path: "",
    changeFrequency: "daily" as const,
    priority: 1,
  },
  {
    path: "/about",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    path: "/contact",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    path: "/faq",
    changeFrequency: "weekly" as const,
    priority: 0.8,
  },
  {
    path: "/news",
    changeFrequency: "daily" as const,
    priority: 0.9,
  },
  {
    path: "/privacy",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  {
    path: "/terms",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
]

async function getNews(): Promise<PublicNewsItem[]> {
  if (!API_URL) {
    return []
  }

  try {
    /*
     * Get published news.
     *
     * If your backend already exposes only published
     * news through this endpoint, this is enough.
     */
    const response = await fetch(
      `${API_URL}/news`,
      {
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    /*
     * Supports:
     * { items: [...] }
     *
     * and also a direct array.
     */
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : []

    return items.filter(
      (item: PublicNewsItem) =>
        item &&
        item.id &&
        item.isPublished !== false
    )
  } catch (error) {
    console.error(
      "Sitemap news fetch failed:",
      error
    )

    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  /*
   * Static public pages
   */
  const staticPages: MetadataRoute.Sitemap =
    LOCALES.flatMap((locale) =>
      PUBLIC_PAGES.map((page) => ({
        url:
          `${BASE_URL}/${locale}${page.path}`,

        lastModified: now,

        changeFrequency:
          page.changeFrequency,

        priority: page.priority,
      }))
    )

  /*
   * Dynamic news pages
   */
  const news = await getNews()

  const newsPages: MetadataRoute.Sitemap =
    news.flatMap((item) => {
      const encodedId =
        encodeURIComponent(item.id)

      const lastModified =
        item.updatedAt ||
        item.publishedAt ||
        item.createdAt ||
        now

      return LOCALES.map((locale) => ({
        url:
          `${BASE_URL}/${locale}/news/${encodedId}`,

        lastModified,

        changeFrequency:
          "weekly" as const,

        priority: 0.8,
      }))
    })

  return [
    ...staticPages,
    ...newsPages,
  ]
}