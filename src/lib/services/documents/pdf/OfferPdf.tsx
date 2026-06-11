// ============================================================
// Document PDF — Offre commerciale (US-025)
// ============================================================

import { View, Text, StyleSheet } from "@react-pdf/renderer"
import { PdfShell, accentFor } from "./PdfShell"
import type { PdfBranding } from "./branding"
import type { PdfChromeLabels, PdfOfferLabels } from "./labels"
import type { CommercialOfferContent } from "../commercial-offer"

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
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 12, fontSize: 10 },
  listText: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  service: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: SOFT,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  serviceName: { fontSize: 11, fontWeight: "bold", marginBottom: 3 },
  serviceDesc: { fontSize: 9.5, color: "#374151", lineHeight: 1.5, marginBottom: 5 },
  deliverablesLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: MUTED,
    marginBottom: 2,
  },
  step: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 3,
    marginRight: 8,
  },
  stepText: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  pricingLabel: { fontSize: 10, fontWeight: "bold" },
  pricingDesc: { fontSize: 8.5, color: MUTED, marginTop: 1, maxWidth: 360 },
  pricingPrice: { fontSize: 11, fontWeight: "bold" },
  pricingPriceMuted: { fontSize: 10, color: MUTED, fontStyle: "italic" },
})

export interface OfferPdfProps {
  document: { title: string; clientName: string | null; date: string }
  content: CommercialOfferContent
  labels: PdfOfferLabels
  chrome: PdfChromeLabels
  branding: PdfBranding
  fontFamily: string
  rtl: boolean
}

export function OfferPdf({
  document,
  content,
  labels,
  chrome,
  branding,
  fontFamily,
  rtl,
}: OfferPdfProps) {
  const accent = accentFor(branding)

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
      {document.clientName ? (
        <Text style={styles.meta}>
          {labels.clientLabel} : {document.clientName}
        </Text>
      ) : null}
      <Text style={styles.meta}>
        {labels.dateLabel} : {document.date}
      </Text>

      {/* Synthèse */}
      <Text style={[styles.sectionTitle, { color: accent }]}>{labels.summaryTitle}</Text>
      <Text style={styles.paragraph}>{content.executive_summary}</Text>

      {/* Contexte */}
      <Text style={[styles.sectionTitle, { color: accent }]}>{labels.contextTitle}</Text>
      <Text style={styles.paragraph}>{content.context}</Text>

      {/* Objectifs */}
      <Text style={[styles.sectionTitle, { color: accent }]}>{labels.objectivesTitle}</Text>
      {content.objectives.map((obj, i) => (
        <View key={i} style={styles.listItem}>
          <Text style={[styles.bullet, { color: accent }]}>•</Text>
          <Text style={styles.listText}>{obj}</Text>
        </View>
      ))}

      {/* Prestations */}
      <Text style={[styles.sectionTitle, { color: accent }]}>{labels.servicesTitle}</Text>
      {content.services.map((s, i) => (
        <View key={i} style={styles.service} wrap={false}>
          <Text style={styles.serviceName}>{s.name}</Text>
          <Text style={styles.serviceDesc}>{s.description}</Text>
          {s.deliverables.length > 0 ? (
            <View>
              <Text style={styles.deliverablesLabel}>{labels.deliverables}</Text>
              {s.deliverables.map((d, j) => (
                <View key={j} style={styles.listItem}>
                  <Text style={[styles.bullet, { color: accent }]}>✓</Text>
                  <Text style={styles.listText}>{d}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      {/* Méthodologie */}
      <Text style={[styles.sectionTitle, { color: accent }]}>{labels.methodologyTitle}</Text>
      {content.methodology.map((step, i) => (
        <View key={i} style={styles.step} wrap={false}>
          <Text style={[styles.stepNum, { backgroundColor: accent }]}>{i + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      {/* Investissement */}
      {content.pricing.length > 0 ? (
        <View>
          <Text style={[styles.sectionTitle, { color: accent }]}>{labels.pricingTitle}</Text>
          {content.pricing.map((item, i) => (
            <View key={i} style={styles.pricingRow} wrap={false}>
              <View>
                <Text style={styles.pricingLabel}>{item.label}</Text>
                {item.description ? (
                  <Text style={styles.pricingDesc}>{item.description}</Text>
                ) : null}
              </View>
              <Text style={item.price ? styles.pricingPrice : styles.pricingPriceMuted}>
                {item.price || labels.priceOnRequest}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Prochaines étapes */}
      {content.next_steps.length > 0 ? (
        <View>
          <Text style={[styles.sectionTitle, { color: accent }]}>{labels.nextStepsTitle}</Text>
          {content.next_steps.map((step, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={[styles.bullet, { color: accent }]}>✓</Text>
              <Text style={styles.listText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </PdfShell>
  )
}
