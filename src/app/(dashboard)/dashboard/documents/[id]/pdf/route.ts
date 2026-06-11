// ============================================================
// Téléchargement PDF d'un document (offre commerciale / rapport client)
// ============================================================
// Génère un VRAI PDF serveur brandé (header/footer fixes, white-label, locale
// de l'utilisateur) via @react-pdf/renderer. Remplace l'ancien window.print().

import { NextRequest } from "next/server"
import { getLocale, getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import type { Plan } from "@/lib/billing/plans"
import { resolvePdfBranding } from "@/lib/services/documents/pdf/branding"
import {
  buildPdfChromeLabels,
  buildPdfOfferLabels,
  buildPdfReportLabels,
} from "@/lib/services/documents/pdf/labels"
import { localeForPdfLabels } from "@/lib/services/documents/pdf/fonts"
import { renderOfferPdf, renderReportPdf, pdfFilename } from "@/lib/services/documents/pdf/render"
import { CommercialOfferContentSchema } from "@/lib/services/documents/commercial-offer"
import { ClientReportContentSchema } from "@/lib/services/documents/client-report"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response("Non authentifié.", { status: 401 })
  }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) {
    return new Response("Tenant introuvable.", { status: 403 })
  }

  // Document (RLS garantit l'isolation tenant).
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("title, type, client_name, content_json")
    .eq("id", id)
    .single()

  if (docError || !doc) {
    return new Response("Document introuvable.", { status: 404 })
  }

  // Plan + Brand DNA du tenant → résolution du branding (white-label).
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("plan, brand_dna")
    .eq("id", tenantId)
    .single()

  const plan = (tenantRow?.plan as Plan | undefined) ?? "free"
  const branding = resolvePdfBranding({ plan, brandDna: tenantRow?.brand_dna ?? null })

  // Locale de l'utilisateur (chinois → libellés EN, faute de police CJK embarquée).
  const locale = await getLocale()
  const labelLocale = localeForPdfLabels(locale)
  const t = await getTranslations({ locale: labelLocale, namespace: "documents" })
  const chrome = buildPdfChromeLabels(t)

  try {
    if (doc.type === "rapport_client") {
      const parsed = ClientReportContentSchema.safeParse(doc.content_json)
      if (!parsed.success) {
        return new Response("Contenu du rapport indisponible.", { status: 422 })
      }
      const pdf = await renderReportPdf({
        document: { title: doc.title, clientName: doc.client_name },
        content: parsed.data,
        labels: buildPdfReportLabels(t),
        chrome,
        branding,
        locale,
      })
      return pdfResponse(pdf, pdfFilename(doc.title, "rapport"))
    }

    // Offre commerciale (et types assimilés).
    const parsed = CommercialOfferContentSchema.safeParse(doc.content_json)
    if (!parsed.success) {
      return new Response("Contenu de l'offre indisponible.", { status: 422 })
    }
    const dateLabel = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date())
    const pdf = await renderOfferPdf({
      document: { title: doc.title, clientName: doc.client_name, date: dateLabel },
      content: parsed.data,
      labels: buildPdfOfferLabels(t),
      chrome,
      branding,
      locale,
    })
    return pdfResponse(pdf, pdfFilename(doc.title, "offre"))
  } catch {
    return new Response("Erreur lors de la génération du PDF.", { status: 500 })
  }
}

function pdfResponse(pdf: Uint8Array, filename: string): Response {
  const body = new Uint8Array(pdf)
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
