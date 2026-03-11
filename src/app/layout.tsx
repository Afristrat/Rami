import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "RAMI — Agency OS by AI-MPower",
    template: "%s | RAMI",
  },
  description:
    "Générez du contenu social media psychologiquement calibré. Chaque post est une flèche conçue pour toucher l'émotion précise de votre audience.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://rami.ai-mpower.com"
  ),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
