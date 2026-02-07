import type { Metadata, Viewport } from "next"
import { Assistant } from "next/font/google"
import "./globals.css"

const assistant = Assistant({ subsets: ["latin", "hebrew"] })

export const metadata: Metadata = {
  title: "RESTOBOT - בוט הזמנת מקומות",
  description:
    "בוט בינה מלאכותית מתקדם להזמנת מקומות במסעדות עם שיחה טבעית בעברית",
}

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={assistant.className}>{children}</body>
    </html>
  )
}
