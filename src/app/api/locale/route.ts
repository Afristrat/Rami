import { NextRequest, NextResponse } from "next/server"
import { locales, type Locale } from "@/i18n/config"

export async function POST(request: NextRequest) {
  const body = await request.json() as { locale?: string }
  const locale = body.locale

  if (!locale || !locales.includes(locale as Locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
  }

  const response = NextResponse.json({ locale })
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
