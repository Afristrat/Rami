// ============================================================
// Layout PDF brandé partagé (socle PDF serveur)
// ============================================================
// Page A4 avec en-tête et pied de page FIXES répétés sur chaque page :
//   - en-tête : logo agence (ou mot-symbole RAMI) + type de document
//   - pied : mention de confidentialité (+ « Propulsé par RAMI » en co-brand)
//     et pagination « Page n / N »
// Le branding (agency | cobrand | rami) et la locale (RTL pour l'arabe) sont
// résolus côté route et passés en props.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { ReactNode } from "react"
import type { PdfBranding } from "./branding"
import type { PdfChromeLabels } from "./labels"

const ACCENT_RAMI = "#7C3AED"
const ACCENT_AGENCY = "#111827"
const MUTED = "#6B7280"
const BORDER = "#E5E7EB"

const styles = StyleSheet.create({
  page: {
    paddingTop: 92,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1F2937",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    marginTop: 16,
    marginHorizontal: 44,
    paddingBottom: 10,
    borderBottomWidth: 2,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  brandLogo: { height: 30, width: 150, objectFit: "contain" },
  brandWordmark: { fontSize: 20, fontWeight: "bold", letterSpacing: 1 },
  brandTagline: { fontSize: 7, color: MUTED, marginTop: 2 },
  headerDocType: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    marginBottom: 14,
    marginHorizontal: 44,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: MUTED },
})

export interface PdfShellProps {
  branding: PdfBranding
  chrome: PdfChromeLabels
  documentType: string
  fontFamily: string
  rtl: boolean
  children: ReactNode
}

export function accentFor(branding: PdfBranding): string {
  return branding.mode === "agency" ? ACCENT_AGENCY : ACCENT_RAMI
}

export function PdfShell({
  branding,
  chrome,
  documentType,
  fontFamily,
  rtl,
  children,
}: PdfShellProps) {
  const accent = accentFor(branding)
  const dir = rtl ? "rtl" : "ltr"

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily, direction: dir }]}>
        {/* En-tête fixe brandé */}
        <View style={[styles.header, { borderBottomColor: accent }]} fixed>
          {branding.logoDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- composant @react-pdf, pas une <img> HTML
            <Image src={branding.logoDataUrl} style={styles.brandLogo} />
          ) : (
            <View>
              <Text style={[styles.brandWordmark, { color: accent }]}>
                {branding.displayName}
              </Text>
              <Text style={styles.brandTagline}>L&apos;IA qui vise juste.</Text>
            </View>
          )}
          <Text style={[styles.headerDocType, { color: accent }]}>{documentType}</Text>
        </View>

        {/* Corps du document */}
        {children}

        {/* Pied de page fixe : confidentialité (+ co-brand) et pagination */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {chrome.confidential}
            {branding.showPoweredBy ? ` · ${chrome.poweredBy}` : ""}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${chrome.pageWord} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
