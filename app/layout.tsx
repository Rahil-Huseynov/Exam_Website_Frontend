import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/contexts/auth-context";
import { LocaleProvider } from "@/contexts/locale-context";

import "./globals.css";

import { ToastContainer } from "react-toastify";

import { MaintenanceWatcher } from "@/components/MaintenanceWatcher";
import MaintenanceClient from "@/components/MaintenanceClient";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://imtahanver.net";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "İmtahanVer.net | Onlayn İmtahan Platforması",
    template: "%s | İmtahanVer.net",
  },

  description:
    "İmtahanVer.net universitet, doktorantura və digər onlayn imtahanlara hazırlaşmaq üçün müasir platformadır.",

  keywords: [
    // Brand
    "İmtahanVer",
    "İmtahanVer.net",

    // Generic
    "imtahan",
    "onlayn imtahan",
    "online exam",
    "imtahan platforması",
    "imtahan sistemi",
    "imtahan portalı",
    "imtahan proqramı",
    "imtahan hazırlığı",

    // Tests
    "test",
    "testlər",
    "onlayn test",
    "quiz",
    "sınaq imtahanı",
    "onlayn sınaq imtahanı",
    "real imtahan",

    // University
    "universitet",
    "universitet imtahanı",
    "ali təhsil",
    "bakalavr",
    "magistratura",
    "magistratura imtahanı",
    "magistratura testləri",
    "doktorantura",
    "doktorantura imtahanı",
    "doktorantura testləri",

    // Azerbaijan
    "Azərbaycan",
    "Azərbaycan imtahan",
    "Azərbaycan təhsil",
    "DİM",
    "Dövlət İmtahan Mərkəzi",

    // Education
    "təhsil",
    "education",
    "learning",
    "e-learning",

    // AI
    "AI exam",
    "AI assessment",
    "süni intellekt",
    "AI qiymətləndirmə",

    // Results
    "imtahan nəticəsi",
    "nəticə",
    "qiymətləndirmə",
    "sertifikat",

    // Search phrases
    "imtahan ver",
    "imtahan həll et",
    "imtahan sualları",
    "imtahan cavabları",
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
    canonical: SITE_URL,
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
    locale: "az_AZ",
    url: SITE_URL,
    siteName: "İmtahanVer.net",
    title: "İmtahanVer.net | Onlayn İmtahan Platforması",
    description:
      "Universitet və doktorantura imtahanlarına hazırlaşmaq üçün onlayn platforma.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "İmtahanVer.net",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "İmtahanVer.net",
    description:
      "Universitet və doktorantura imtahanlarına hazırlaşmaq üçün platforma.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },

  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "İmtahanVer.net",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.png`,
      },
      {
        "@type": "WebSite",
        name: "İmtahanVer.net",
        url: SITE_URL,
      },
    ],
  };

  return (
    <html lang="az">
      <body className={`${geist.className} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

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
      </body>
    </html>
  );
}