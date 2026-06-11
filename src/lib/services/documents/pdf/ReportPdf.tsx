// ============================================================
// Document PDF — Rapport client de performance (US-026)
// ============================================================

import { View, Text, StyleSheet } from "@react-pdf/renderer"
import { PdfShell, accentFor } from "./PdfShell"
import type { PdfBranding } from "./branding"
import type { PdfChromeLabels, PdfReportLabels } from "./labels"
import type { ClientReportContent } from "../client-report"

const MUTED = "#6B7280"
const BORDER = "#E5E7EB"
const SOFT = "#F9FAFB"

const styles = StyleSheet.create({
  docTitle: { fontSize: 19, fontWeight: "bold", marginBottom: 4 },
  meta: { fontSize: 9, color: MUTED, marginBottom: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  paragraph: { fontSize: 10, lineHeight: 1.55, textAlign: "justify" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  kpiCard: {
    width: "33.33%",
    padding: 4,
  },
  kpiInner: {
    padding: 8,
    backgroundColor: SOFT,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  kpiLabel: { fontSize: 8, color: MUTED, marginBottom: 2 },
  kpiValue: { fontSize: 15, fontWeight: "bold" },
  table: { marginTop: 4, borderWidth: 1, borderColor: BORDER, borderRadius: 4 },
  thead: {
    flexDirection: "row",
    backgroundColor: SOFT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  th: { fontSize: 8, fontWeight: "bold", color: MUTED, textTransform: "uppercase" },
  trow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  td: { fontSize: 9 },
  tdStrong: { fontSize: 9, fontWeight: "bold" },
})

// Largeurs de colonnes (en %), partagées thead/rows.
const PLATFORM_COLS = ["34%", "24%", "24%", "18%"]
const POST_COLS = ["40%", "17%", "17%", "14%", "12%"]

export interface ReportPdfProps {
  document: { title: string; clientName: string | null }
  content: ClientReportContent
  labels: PdfReportLabels
  chrome: PdfChromeLabels
  branding: PdfBranding
  fontFamily: string
  rtl: boolean
}

function fmt(n: number): string {
  // Séparateur de milliers fine espace, locale-agnostique pour le PDF.
  return n.toLocaleString("fr-FR").replace(/ /g, " ")
}

export function ReportPdf({
  document,
  content,
  labels,
  chrome,
  branding,
  fontFamily,
  rtl,
}: ReportPdfProps) {
  const accent = accentFor(branding)
  const k = content.kpis

  const kpiCards: Array<{ label: string; value: string }> = [
    { label: labels.kpiPublished, value: fmt(k.publishedCount) },
    { label: labels.kpiImpressions, value: fmt(k.impressions) },
    { label: labels.kpiInteractions, value: fmt(k.interactions) },
    { label: labels.kpiEngagementRate, value: `${k.engagementRate}%` },
    { label: labels.kpiClicks, value: fmt(k.clicks) },
    { label: labels.kpiLikes, value: fmt(k.likes) },
  ]

  return (
    <PdfShell
      branding={branding}
      chrome={chrome}
      documentType={labels.documentType}
      fontFamily={fontFamily}
      rtl={rtl}
    >
      {/* Titre + méta */}
      <Text style={styles.docTitle}>{document.title}</Text>
      {content.brand_name ? (
        <Text style={styles.meta}>
          {labels.brandLabel} : {content.brand_name}
        </Text>
      ) : null}
      {document.clientName ? (
        <Text style={styles.meta}>
          {labels.clientLabel} : {document.clientName}
        </Text>
      ) : null}
      <Text style={styles.meta}>
        {labels.periodLabel} : {content.period_start} — {content.period_end}
      </Text>

      {/* Synthèse exécutive (commentaire des chiffres réels) */}
      {content.narrative ? (
        <View>
          <Text style={[styles.sectionTitle, { color: accent }]}>{labels.summaryTitle}</Text>
          <Text style={styles.paragraph}>{content.narrative}</Text>
        </View>
      ) : null}

      {/* Indicateurs clés */}
      <Text style={[styles.sectionTitle, { color: accent }]}>{labels.kpisTitle}</Text>
      <View style={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <View key={card.label} style={styles.kpiCard}>
            <View style={styles.kpiInner}>
              <Text style={styles.kpiLabel}>{card.label}</Text>
              <Text style={styles.kpiValue}>{card.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Performance par plateforme */}
      {content.platforms.length > 0 ? (
        <View>
          <Text style={[styles.sectionTitle, { color: accent }]}>{labels.platformsTitle}</Text>
          <View style={styles.table}>
            <View style={styles.thead} fixed>
              <Text style={[styles.th, { width: PLATFORM_COLS[0] }]}>{labels.colPlatform}</Text>
              <Text style={[styles.th, { width: PLATFORM_COLS[1] }]}>{labels.kpiImpressions}</Text>
              <Text style={[styles.th, { width: PLATFORM_COLS[2] }]}>{labels.kpiInteractions}</Text>
              <Text style={[styles.th, { width: PLATFORM_COLS[3] }]}>{labels.kpiEngagementRate}</Text>
            </View>
            {content.platforms.map((p, i) => (
              <View key={i} style={styles.trow} wrap={false}>
                <Text style={[styles.tdStrong, { width: PLATFORM_COLS[0] }]}>{p.platform}</Text>
                <Text style={[styles.td, { width: PLATFORM_COLS[1] }]}>{fmt(p.impressions)}</Text>
                <Text style={[styles.td, { width: PLATFORM_COLS[2] }]}>{fmt(p.interactions)}</Text>
                <Text style={[styles.td, { width: PLATFORM_COLS[3] }]}>{p.engagementRate}%</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Meilleures publications */}
      {content.top_posts.length > 0 ? (
        <View>
          <Text style={[styles.sectionTitle, { color: accent }]}>{labels.topPostsTitle}</Text>
          <View style={styles.table}>
            <View style={styles.thead} fixed>
              <Text style={[styles.th, { width: POST_COLS[0] }]}>{labels.colPost}</Text>
              <Text style={[styles.th, { width: POST_COLS[1] }]}>{labels.kpiImpressions}</Text>
              <Text style={[styles.th, { width: POST_COLS[2] }]}>{labels.kpiInteractions}</Text>
              <Text style={[styles.th, { width: POST_COLS[3] }]}>{labels.kpiEngagementRate}</Text>
              <Text style={[styles.th, { width: POST_COLS[4] }]}>{labels.kpiClicks}</Text>
            </View>
            {content.top_posts.map((p, i) => (
              <View key={i} style={styles.trow} wrap={false}>
                <Text style={[styles.tdStrong, { width: POST_COLS[0] }]}>{p.title}</Text>
                <Text style={[styles.td, { width: POST_COLS[1] }]}>{fmt(p.impressions)}</Text>
                <Text style={[styles.td, { width: POST_COLS[2] }]}>{fmt(p.interactions)}</Text>
                <Text style={[styles.td, { width: POST_COLS[3] }]}>{p.engagementRate}%</Text>
                <Text style={[styles.td, { width: POST_COLS[4] }]}>{fmt(p.clicks)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </PdfShell>
  )
}
