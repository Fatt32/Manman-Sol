import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Manman Sol — Jere Sol Ou Fasil",
  description: "Aplikasyon pou jere Sol ak fasilite, sekirize ak pwofesyonèl.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Manman Sol",
  },
}

export const viewport: Viewport = {
  themeColor: "#04041a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ht" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col relative" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
