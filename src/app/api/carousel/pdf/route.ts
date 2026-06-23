// ============================================================
// POST /api/carousel/pdf — rend un carrousel (deck validé) en PDF document
// LinkedIn. Stateless : le corps EST le deck. Auth requise (membre du tenant).
// ============================================================

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { carouselSchema } from "@/lib/schemas/carousel.schema"
import { renderCarouselPdf } from "@/lib/services/documents/carousel/carousel-pdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = carouselSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_carousel", details: parsed.error.issues }, { status: 422 })
  }

  const pdf = await renderCarouselPdf(parsed.data)
  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="carrousel-rami.pdf"',
      "Cache-Control": "no-store",
    },
  })
}
