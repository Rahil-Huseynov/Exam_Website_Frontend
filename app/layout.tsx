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
    "İmtahanVer",
    "İmtahanVer.net",
    "imtahan",
    "onlayn imtahan",
    "online exam",
    "imtahan platforması",
    "imtahan sistemi",
    "imtahan portalı",
    "imtahan proqramı",
    "imtahan hazırlığı",
    "test",
    "testlər",
    "onlayn test",
    "quiz",
    "sınaq imtahanı",
    "onlayn sınaq imtahanı",
    "real imtahan",
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
    "Azərbaycan",
    "Azərbaycan imtahan",
    "Azərbaycan təhsil",
    "DİM",
    "Dövlət İmtahan Mərkəzi",
    "təhsil",
    "education",
    "learning",
    "e-learning",
    "AI exam",
    "AI assessment",
    "süni intellekt",
    "AI qiymətləndirmə",
    "imtahan nəticəsi",
    "nəticə",
    "qiymətləndirmə",
    "sertifikat",
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

  // XƏTANIN BAŞLICA SƏBƏBİ BURADA İDİ:
  // Layout səviyyəsində bərk 'canonical' saxlamırıq ki, alt səhifələr öz URL-ni verə bilsin.

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
    siteName: "İmtahanVer.net",
    title: "İmtahanVer.net | Onlayn İmtahan Platforması",
    description:
      "Universitet və doktorantura imtahanlarına hazırlaşmaq üçün onlayn platforma.",
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
    title: "İmtahanVer.net",
    description:
      "Universitet və doktorantura imtahanlarına hazırlaşmaq üçün platforma.",
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