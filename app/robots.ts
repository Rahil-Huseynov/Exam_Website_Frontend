import { MetadataRoute } from "next";

const SITE_URL = "https://imtahanver.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",

        allow: [
          "/",
          "/about",
          "/contact",
          "/faq",
          "/news",
        ],

        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/profile/",
          "/payments/",
          "/balance/",
          "/settings/",
          "/auth/",
          "/login",
          "/register",
          "/forgot-password",
          "/verify",
          "/exam-token/",
          "/exam-continue/",
        ],
      },
    ],

    sitemap: `${SITE_URL}/sitemap.xml`,

    host: SITE_URL,
  };
}