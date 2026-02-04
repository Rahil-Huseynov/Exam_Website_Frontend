import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { LocaleProvider } from "@/contexts/locale-context"
import "./globals.css"
import { ToastContainer } from "react-toastify"
import { MaintenanceWatcher } from "@/components/MaintenanceWatcher"
import MaintenanceClient from "@/components/MaintenanceClient"
import { MaintenanceGuard } from "@/components/MaintenanceGuard"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "İmtahanVer.net – Onlayn Universitet İmtahanları",
  description: "Universitet imtahanlarını real suallarla onlayn şəkildə sına",
  icons: {
    icon: [
      {
        url: "/favicon.png",
      },
      {
        url: "/favicon.png",
        type: "image/png",
      },
      {
        url: "/favicon.png",
        type: "image/png",
      },
    ],
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="az">
      <body className="font-sans antialiased">
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
  )
}
