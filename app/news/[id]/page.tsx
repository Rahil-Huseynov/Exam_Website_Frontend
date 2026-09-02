import type { Metadata } from "next";
import NewsDetailClient from "./news-detail-client";
import { api, type PublicNewsItem } from "@/lib/api";

const NEXT_PUBLIC_API_URL_FOR_IMAGE = process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE || "https://imtahanver.net";
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://imtahanver.net";
const NEXT_PUBLIC_FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID || "123456789012345";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const currentCanonicalUrl = `${NEXT_PUBLIC_SITE_URL}/news/${id}`;

  if (!id) {
    return {
      title: "Xəbərlər | İmtahanVer.net",
      alternates: { canonical: `${NEXT_PUBLIC_SITE_URL}/news` },
    };
  }

  try {
    // API klası vasitəsilə getNewsShare metodunu çağırırıq
    const news = (await api.getNewsShare(id)) as PublicNewsItem;

    if (!news || !news.title) {
      return {
        title: "İmtahanVer.net | Xəbər",
        alternates: { canonical: currentCanonicalUrl },
      };
    }

    let imageUrl = news.imageUrl || "";
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${NEXT_PUBLIC_API_URL_FOR_IMAGE}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }

    const title = news.title;
    const description = (news.content || "")
      .replace(/<[^>]*>?/gm, "")
      .trim()
      .slice(0, 160) || "İmtahanVer.net xəbərləri";

    return {
      title: title,
      description: description,
      alternates: {
        canonical: currentCanonicalUrl,
      },
      other: {
        "fb:app_id": NEXT_PUBLIC_FB_APP_ID,
      },
      openGraph: {
        title: title,
        description: description,
        url: currentCanonicalUrl,
        siteName: "İmtahanVer.net",
        type: "article",
        locale: "az_AZ",
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 600,
                height: 600,
                alt: title,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary",
        title: title,
        description: description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    console.error("generateMetadata error:", error);
    return {
      title: "İmtahanVer.net | Xəbər",
      alternates: { canonical: currentCanonicalUrl },
    };
  }
}

export default function NewsDetailPage() {
  return <NewsDetailClient />;
}