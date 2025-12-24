import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { LocaleProvider } from "@/contexts/locale-context"
import "./globals.css"
import { ToastContainer } from "react-toastify"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ExamPlatform - Online University Exams",
  description: "Practice university exams online with real questions",
  icons: {
    icon: [
      {
        url: "",
        media: "",
      },
      {
        url: "",
        media: "",
      },
      {
        url: "",
        type: "",
      },
    ],
    apple: "",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <LocaleProvider>
          <AuthProvider>{children}</AuthProvider>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            draggable
          />
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  )
}
