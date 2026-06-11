// ============================================================
// Libellés PDF localisés (socle PDF serveur)
// ============================================================
// Les composants @react-pdf/renderer s'exécutent hors contexte React next-intl :
// ils ne peuvent pas appeler useTranslations / getTranslations. On résout donc
// TOUS les libellés côté route (selon la locale de l'utilisateur) et on les passe
// au document via cet objet sérialisable.

/** Fonction de traduction (signature de next-intl getTranslations/useTranslations). */
type TFunc = (key: string, values?: Record<string, string | number>) => string

export interface PdfChromeLabels {
  confidential: string
  pageWord: string
  poweredBy: string
}

export interface PdfOfferLabels {
  documentType: string
  clientLabel: string
  dateLabel: string
  summaryTitle: string
  contextTitle: string
  objectivesTitle: string
  servicesTitle: string
  deliverables: string
  methodologyTitle: string
  pricingTitle: string
  priceOnRequest: string
  nextStepsTitle: string
}

export interface PdfReportLabels {
  documentType: string
  brandLabel: string
  clientLabel: string
  periodLabel: string
  summaryTitle: string
  kpisTitle: string
  platformsTitle: string
  topPostsTitle: string
  kpiPublished: string
  kpiImpressions: string
  kpiInteractions: string
  kpiEngagementRate: string
  kpiClicks: string
  kpiLikes: string
  colPlatform: string
  colPost: string
}

/** Libellés du chrome (header/footer) communs à tous les documents. */
export function buildPdfChromeLabels(t: TFunc): PdfChromeLabels {
  return {
    confidential: t("pdfConfidential"),
    pageWord: t("pdfPage"),
    poweredBy: t("pdfPoweredBy"),
  }
}

export function buildPdfOfferLabels(t: TFunc): PdfOfferLabels {
  return {
    documentType: t("typeProposal"),
    clientLabel: t("offerClientLabel"),
    dateLabel: t("offerDateLabel"),
    summaryTitle: t("offerSummaryTitle"),
    contextTitle: t("offerContextTitle"),
    objectivesTitle: t("offerObjectivesTitle"),
    servicesTitle: t("offerServicesTitle"),
    deliverables: t("offerDeliverables"),
    methodologyTitle: t("offerMethodologyTitle"),
    pricingTitle: t("offerPricingTitle"),
    priceOnRequest: t("offerPriceOnRequest"),
    nextStepsTitle: t("offerNextStepsTitle"),
  }
}

export function buildPdfReportLabels(t: TFunc): PdfReportLabels {
  return {
    documentType: t("typeReport"),
    brandLabel: t("reportBrandLabel"),
    clientLabel: t("reportClientLabel"),
    periodLabel: t("reportPeriodLabel"),
    summaryTitle: t("offerSummaryTitle"),
    kpisTitle: t("reportKpisTitle"),
    platformsTitle: t("reportPlatformsTitle"),
    topPostsTitle: t("reportTopPostsTitle"),
    kpiPublished: t("kpiPublished"),
    kpiImpressions: t("kpiImpressions"),
    kpiInteractions: t("kpiInteractions"),
    kpiEngagementRate: t("kpiEngagementRate"),
    kpiClicks: t("kpiClicks"),
    kpiLikes: t("kpiLikes"),
    colPlatform: t("colPlatform"),
    colPost: t("colPost"),
  }
}
