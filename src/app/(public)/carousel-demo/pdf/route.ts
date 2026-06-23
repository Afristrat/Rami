// ============================================================
// Démo : télécharge le carrousel « Négociation Augmentée » en PDF (document
// LinkedIn) généré par le moteur natif RAMI. Prouve « design React → PDF » avec
// accents parfaits, sans Chromium. Public (route démo).
// ============================================================

import { NextResponse } from "next/server"
import { renderCarouselPdf } from "@/lib/services/documents/carousel/carousel-pdf"
import { DEMO_CAROUSEL } from "@/lib/services/documents/carousel/demo-deck"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const pdf = await renderCarouselPdf(DEMO_CAROUSEL)
  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="carrousel-negociation-rami.pdf"',
      "Cache-Control": "no-store",
    },
  })
}
