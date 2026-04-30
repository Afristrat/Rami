import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── Locale detection (first visit, no cookie yet) ──
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (!localeCookie || !locales.includes(localeCookie as typeof locales[number])) {
    const acceptLanguage = request.headers.get('Accept-Language') ?? ''
    const detected = acceptLanguage
      .split(',')
      .map((part) => part.split(';')[0].trim().split('-')[0])
      .find((lang) => locales.includes(lang as typeof locales[number]))
    const locale = detected ?? defaultLocale
    supabaseResponse.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes protégées : rediriger vers /login si non authentifié
  const protectedPaths = ['/dashboard', '/tenants', '/scheduler', '/brand-dna', '/content', '/publishing', '/analytics', '/settings', '/admin']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Super admin : accès direct sans onboarding
  const isSuperAdmin = user?.app_metadata?.role === 'super_admin'

  // Onboarding obligatoire : si auth + non-onboardé + non-super_admin + sur route protégée → /onboarding
  const onboardingCompleted = user?.user_metadata?.onboarding_completed === true
  if (isProtected && user && !onboardingCompleted && !isSuperAdmin) {
    // Ne pas boucler sur /onboarding lui-même
    if (pathname !== '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  // Si déjà onboardé (ou super_admin) et sur /onboarding → /dashboard
  if (pathname === '/onboarding' && user && (onboardingCompleted || isSuperAdmin)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Rediriger vers /dashboard si déjà connecté et sur /login ou /register
  const authPaths = ['/login', '/register']
  const isAuthPage = authPaths.some(p => pathname.startsWith(p))

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = (onboardingCompleted || isSuperAdmin) ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
