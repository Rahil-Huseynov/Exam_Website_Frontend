import type { Metadata } from "next";
import NewsDetailClient from "./news-detail-client";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://imtahanver.net/api";
const NEXT_PUBLIC_API_URL_FOR_IMAGE = process.env.NEXT_PUBLIC_API_URL_FOR_IMAGE || "https://imtahanver.net";
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://imtahanver.net";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const currentCanonicalUrl = `${NEXT_PUBLIC_SITE_URL}/news/${id}`;

  if (!id) {
    return {
      title: "Xəbər tapılmadı",
      alternates: { canonical: `${NEXT_PUBLIC_SITE_URL}/news` },
    };
  }

  try {
    const res = await fetch(`${NEXT_PUBLIC_API_URL}/news/${id}?lang=az`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Xəbər tapılmadı",
        alternates: { canonical: currentCanonicalUrl },
      };
    }

    const news = await res.json();

    // Absolute Image URL düzəlişi
    let imageUrl = news.imageUrl || "";
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${NEXT_PUBLIC_API_URL_FOR_IMAGE}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }

    const title = news.title || "Xəbər";
    const description = (news.content || "").replace(/<[^>]*>?/gm, "").slice(0, 160);

    return {
      title: title,
      description: description,
      alternates: {
        canonical: currentCanonicalUrl, // Facebook üçün həlledici hissə
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
                width: 1200,
                height: 630,
                alt: title,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: "Xəbərlər",
      alternates: { canonical: currentCanonicalUrl },
    };
  }
}

export default function NewsDetailPage() {
  return <NewsDetailClient />;
}