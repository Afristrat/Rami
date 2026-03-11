import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
  const protectedPaths = ['/dashboard', '/tenants', '/scheduler', '/brand-dna', '/content', '/publishing', '/analytics', '/settings']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Onboarding obligatoire : si auth + non-onboardé + sur route protégée → /onboarding
  const onboardingCompleted = user?.user_metadata?.onboarding_completed === true
  if (isProtected && user && !onboardingCompleted) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Si déjà onboardé et sur /onboarding → /dashboard
  if (pathname === '/onboarding' && user && onboardingCompleted) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Rediriger vers /dashboard si déjà connecté et sur /login ou /register
  const authPaths = ['/login', '/register']
  const isAuthPage = authPaths.some(p => pathname.startsWith(p))

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = onboardingCompleted ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
