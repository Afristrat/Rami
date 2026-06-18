import type { Metadata } from "next"
// Polices Geist chargées en local (package `geist`) plutôt que via next/font/google :
// évite tout fetch réseau vers Google Fonts au build (build self-hosted sans IPv6 routable).
// Les variables CSS exposées sont identiques : --font-geist-sans / --font-geist-mono.
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "next-themes"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { Toaster } from "@/components/ui/sonner"
import { PostHogProvider } from "@/components/providers/posthog-provider"
import { rtlLocales, type Locale } from "@/i18n/config"
import "./globals.css"

export const metadata: Metadata = {
  title: "RAMI by AI-MPower",
  description: "Agency OS — Contenu social media psychologiquement calibré",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr"

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster richColors closeButton />
            </ThemeProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
