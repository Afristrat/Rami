// ============================================================
// Rendu PDF serveur (socle PDF serveur)
// ============================================================
// Point d'entrée unique : enregistre les polices puis produit un Buffer PDF.
// Importé uniquement par la route de téléchargement (jamais côté client).

import { renderToBuffer } from "@react-pdf/renderer"
import { registerPdfFonts, fontForLocale } from "./fonts"
import { OfferPdf } from "./OfferPdf"
import { ReportPdf } from "./ReportPdf"
import type { PdfBranding } from "./branding"
import type { PdfChromeLabels, PdfOfferLabels, PdfReportLabels } from "./labels"
import type { CommercialOfferContent } from "../commercial-offer"
import type { ClientReportContent } from "../client-report"

export async function renderOfferPdf(args: {
  document: { title: string; clientName: string | null; date: string }
  content: CommercialOfferContent
  labels: PdfOfferLabels
  chrome: PdfChromeLabels
  branding: PdfBranding
  locale: string
}): Promise<Uint8Array> {
  registerPdfFonts()
  const { family, rtl } = fontForLocale(args.locale)
  return renderToBuffer(
    <OfferPdf
      document={args.document}
      content={args.content}
      labels={args.labels}
      chrome={args.chrome}
      branding={args.branding}
      fontFamily={family}
      rtl={rtl}
    />
  )
}

export async function renderReportPdf(args: {
  document: { title: string; clientName: string | null }
  content: ClientReportContent
  labels: PdfReportLabels
  chrome: PdfChromeLabels
  branding: PdfBranding
  locale: string
}): Promise<Uint8Array> {
  registerPdfFonts()
  const { family, rtl } = fontForLocale(args.locale)
  return renderToBuffer(
    <ReportPdf
      document={args.document}
      content={args.content}
      labels={args.labels}
      chrome={args.chrome}
      branding={args.branding}
      fontFamily={family}
      rtl={rtl}
    />
  )
}

/** Nom de fichier sûr (slug ASCII) pour le Content-Disposition. */
export function pdfFilename(title: string, fallback: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80)
  return `${slug || fallback}.pdf`
}
