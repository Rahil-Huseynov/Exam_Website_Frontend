import type { MetadataRoute } from "next"

const SITE_URL = "https://imtahanver.net"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",

      allow: "/",

      disallow: [
        // API / system
        "/api/",
        "/_next/",

        // Admin
        "/admin/",
        "/az/admin/",
        "/en/admin/",
        "/ru/admin/",

        // Authentication
        "/login/",
        "/register/",
        "/forgot-password/",
        "/reset-password/",
        "/verify/",

        "/az/login/",
        "/az/register/",
        "/az/forgot-password/",
        "/az/reset-password/",
        "/az/verify/",

        "/en/login/",
        "/en/register/",
        "/en/forgot-password/",
        "/en/reset-password/",
        "/en/verify/",

        "/ru/login/",
        "/ru/register/",
        "/ru/forgot-password/",
        "/ru/reset-password/",
        "/ru/verify/",

        // Private user pages
        "/dashboard/",
        "/profile/",
        "/balance/",
        "/payments/",
        "/settings/",

        "/az/dashboard/",
        "/az/profile/",
        "/az/balance/",
        "/az/payments/",
        "/az/settings/",

        "/en/dashboard/",
        "/en/profile/",
        "/en/balance/",
        "/en/payments/",
        "/en/settings/",

        "/ru/dashboard/",
        "/ru/profile/",
        "/ru/balance/",
        "/ru/payments/",
        "/ru/settings/",

        // Exam process
        "/exam-token/",
        "/exam-continue/",
        "/results/",

        "/az/exam-token/",
        "/az/exam-continue/",
        "/az/results/",

        "/en/exam-token/",
        "/en/exam-continue/",
        "/en/results/",

        "/ru/exam-token/",
        "/ru/exam-continue/",
        "/ru/results/",
      ],
    },

    sitemap: `${SITE_URL}/sitemap.xml`,

    host: SITE_URL,
  }
}