import type { Metadata } from "next";
import NewsDetailClient from "./news-detail-client";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://imtahanver.net/api";
const NEXT_PUBLIC_API_URL_FOR_IMAGE = process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE || "https://imtahanver.net";
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://imtahanver.net";
const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dv_prod_9f2c7e8b4a6d1e0f3a9c5b7d8e2a1f4c6b9e0d3a8f7c5b4e2a9d119712004";

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
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/news/${id}?lang=az`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": NEXT_PUBLIC_API_KEY,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "İmtahanVer.net | Xəbər",
        alternates: { canonical: currentCanonicalUrl },
      };
    }

    const news = await res.json();

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
                width: 600, // Kvadrat nisbəti şəklin kəsilmədən (contain) görünməsini təmin edir
                height: 600,
                alt: title,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary", // 'summary' rejimi şəkli kəsmədən contain kimi göstərir
        title: title,
        description: description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: "İmtahanVer.net | Xəbər",
      alternates: { canonical: currentCanonicalUrl },
    };
  }
}

export default function NewsDetailPage() {
  return <NewsDetailClient />;
}