import type { Metadata } from "next"
import NewsDetailClient from "./news-detail-client"
import { api, type PublicNewsItem } from "@/lib/api"

const NEXT_PUBLIC_API_URL_FOR_IMAGE = process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE || "https://imtahanver.net"
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://imtahanver.net"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const id = resolvedParams?.id
  const currentCanonicalUrl = `${NEXT_PUBLIC_SITE_URL}/news/${id}`

  if (!id) {
    return {
      title: "Xəbərlər | İmtahanVer.net",
      alternates: { canonical: `${NEXT_PUBLIC_SITE_URL}/news` },
    }
  }

  try {
    // news obyektini PublicNewsItem tipi ilə kast edirik
    const news = (await api.getNewsImage(id)) as PublicNewsItem

    if (!news || (!news.title && !news.id)) {
      return {
        title: "İmtahanVer.net | Xəbər",
        alternates: { canonical: currentCanonicalUrl },
      }
    }

    let imageUrl = news.imageUrl || ""
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${NEXT_PUBLIC_API_URL_FOR_IMAGE}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
    }

    const title = news.title || "Xəbər"
    const description = (news.content || "")
      .replace(/<[^>]*>?/gm, "")
      .trim()
      .slice(0, 160) || "İmtahanVer.net xəbərləri"

    const defaultOgImage = `${NEXT_PUBLIC_SITE_URL}/og-image.png`

    return {
      title: title,
      description: description,
      alternates: {
        canonical: currentCanonicalUrl,
      },
      openGraph: {
        title: title,
        description: description,
        url: currentCanonicalUrl,
        siteName: "İmtahanVer.net",
        type: "article",
        locale: "az_AZ",
        images: [
          {
            url: imageUrl || defaultOgImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: [imageUrl || defaultOgImage],
      },
    }
  } catch (error) {
    console.error("generateMetadata API Error:", error)
    return {
      title: "İmtahanVer.net | Xəbər",
      alternates: { canonical: currentCanonicalUrl },
    }
  }
}

export default function NewsDetailPage() {
  return <NewsDetailClient />
}