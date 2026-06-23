// ============================================================
// Rendu PDF d'un carrousel (document LinkedIn) via @react-pdf/renderer.
// Mêmes slides que CarouselSlide, mappées en primitives @react-pdf à 1080×1350
// (4:5). Polices Noto embarquées → accents garantis. Pur serveur.
// 1 unité "u" = 1% de la largeur (1080) → calque fidèle des tailles cqw du React.
// ============================================================

import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer"
import { registerPdfFonts } from "@/lib/services/documents/pdf/fonts"
import type { Carousel, CarouselSlide } from "@/lib/schemas/carousel.schema"

const W = 1080
const H = 1350
const u = (n: number): number => (n / 100) * W // cqw → pt

type Colors = { bg: string; text: string; muted: string; panel: string; hairline: string }
function colors(theme: "dark" | "light"): Colors {
  return theme === "dark"
    ? { bg: "#0B0B0F", text: "#F4F4F5", muted: "#9CA3AF", panel: "rgba(255,255,255,0.05)", hairline: "rgba(255,255,255,0.12)" }
    : { bg: "#FBFBFD", text: "#0B0B0F", muted: "#6B7280", panel: "rgba(0,0,0,0.04)", hairline: "rgba(0,0,0,0.12)" }
}

function Slide({
  slide,
  index,
  total,
  accentHex,
  theme,
  handle,
}: {
  slide: CarouselSlide
  index: number
  total: number
  accentHex: string
  theme: "dark" | "light"
  handle?: string
}) {
  const c = colors(theme)
  const isCover = slide.type === "cover"
  const s = StyleSheet.create({
    page: { backgroundColor: c.bg, color: c.text, fontFamily: "NotoSans", position: "relative" },
    accentBar: { position: "absolute", top: 0, left: 0, right: 0, height: u(1.4), backgroundColor: accentHex },
    body: {
      flexGrow: 1,
      paddingHorizontal: u(8),
      paddingTop: u(9),
      paddingBottom: isCover ? u(8) : u(13),
      flexDirection: "column",
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: u(9),
      paddingHorizontal: u(8),
      borderTopWidth: 1,
      borderTopColor: c.hairline,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  })

  return (
    <Page size={[W, H]} style={s.page}>
      <View style={s.accentBar} />
      <View style={s.body}>
        {slide.type === "cover" && (
          <View style={{ flexGrow: 1, justifyContent: "center" }}>
            {slide.eyebrow ? (
              <Text style={{ fontSize: u(3.2), letterSpacing: u(0.55), color: accentHex, fontWeight: "bold", textTransform: "uppercase", marginBottom: u(3) }}>
                {slide.eyebrow}
              </Text>
            ) : null}
            <Text style={{ fontSize: u(11), lineHeight: 1.05, fontWeight: "bold" }}>{slide.title}</Text>
            {slide.subtitle ? (
              <Text style={{ fontSize: u(4.4), color: c.muted, marginTop: u(4), lineHeight: 1.35 }}>{slide.subtitle}</Text>
            ) : null}
            <View style={{ marginTop: "auto" }}>
              <View style={{ height: u(0.6), width: u(16), backgroundColor: accentHex, borderRadius: u(0.3) }} />
              {slide.author ? <Text style={{ fontSize: u(3.4), color: c.muted, marginTop: u(3) }}>{slide.author}</Text> : null}
            </View>
          </View>
        )}

        {slide.type === "point" && (
          <View style={{ flexGrow: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              {slide.index ? (
                <Text style={{ fontSize: u(9), color: accentHex, fontWeight: "bold", marginRight: u(3), lineHeight: 1 }}>{slide.index}</Text>
              ) : null}
              <Text style={{ fontSize: u(7.2), lineHeight: 1.1, fontWeight: "bold", flexShrink: 1 }}>{slide.heading}</Text>
            </View>
            {slide.body ? (
              <Text style={{ fontSize: u(4.4), color: c.muted, marginTop: u(5), lineHeight: 1.45 }}>{slide.body}</Text>
            ) : null}
            {slide.bullets && slide.bullets.length > 0 ? (
              <View style={{ marginTop: u(5) }}>
                {slide.bullets.map((b, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: u(3) }}>
                    <Text style={{ color: accentHex, fontWeight: "bold", marginRight: u(3) }}>›</Text>
                    <Text style={{ fontSize: u(4.2), lineHeight: 1.35, flexShrink: 1 }}>{b}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {slide.type === "stat" && (
          <View style={{ flexGrow: 1, justifyContent: "center" }}>
            <Text style={{ fontSize: u(24), color: accentHex, fontWeight: "bold", lineHeight: 0.95 }}>{slide.value}</Text>
            <Text style={{ fontSize: u(6), fontWeight: "bold", marginTop: u(2), lineHeight: 1.15 }}>{slide.label}</Text>
            {slide.context ? (
              <Text style={{ fontSize: u(4), color: c.muted, marginTop: u(4), lineHeight: 1.4 }}>{slide.context}</Text>
            ) : null}
          </View>
        )}

        {slide.type === "quote" && (
          <View style={{ flexGrow: 1, justifyContent: "center" }}>
            <Text style={{ fontSize: u(16), color: accentHex, lineHeight: 1 }}>“</Text>
            <Text style={{ fontSize: u(6.4), lineHeight: 1.3, fontWeight: "bold", marginTop: u(2) }}>{slide.text}</Text>
            {slide.attribution ? <Text style={{ fontSize: u(3.6), color: c.muted, marginTop: u(4) }}>— {slide.attribution}</Text> : null}
          </View>
        )}

        {slide.type === "comparison" && (
          <View style={{ flexGrow: 1, justifyContent: "center" }}>
            {[
              { title: slide.leftTitle, items: slide.leftItems, accent: false },
              { title: slide.rightTitle, items: slide.rightItems, accent: true },
            ].map((col, ci) => (
              <View
                key={ci}
                style={{ backgroundColor: c.panel, borderWidth: 1, borderColor: col.accent ? accentHex : c.hairline, borderRadius: u(3), padding: u(5), marginBottom: ci === 0 ? u(4) : 0 }}
              >
                <Text style={{ fontSize: u(3.4), letterSpacing: u(0.4), color: col.accent ? accentHex : c.muted, fontWeight: "bold", textTransform: "uppercase", marginBottom: u(3) }}>
                  {col.title}
                </Text>
                {col.items.map((it, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: u(2) }}>
                    <Text style={{ color: col.accent ? accentHex : c.muted, marginRight: u(2.5) }}>•</Text>
                    <Text style={{ fontSize: u(4), lineHeight: 1.3, flexShrink: 1 }}>{it}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {slide.type === "cta" && (
          <View style={{ flexGrow: 1, justifyContent: "center" }}>
            <Text style={{ fontSize: u(8.5), lineHeight: 1.1, fontWeight: "bold" }}>{slide.heading}</Text>
            {slide.body ? <Text style={{ fontSize: u(4.4), color: c.muted, marginTop: u(4), lineHeight: 1.4 }}>{slide.body}</Text> : null}
            {slide.action ? (
              <View style={{ backgroundColor: accentHex, borderRadius: u(8), paddingVertical: u(3.5), paddingHorizontal: u(6), marginTop: u(6), alignSelf: "flex-start" }}>
                <Text style={{ color: theme === "dark" ? "#0B0B0F" : "#FFFFFF", fontSize: u(4.2), fontWeight: "bold" }}>{slide.action}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {!isCover && (
        <View style={s.footer}>
          <Text style={{ fontSize: u(3), color: c.muted }}>{handle ?? ""}</Text>
          <Text style={{ fontSize: u(3), color: c.muted, fontWeight: "bold" }}>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </Text>
        </View>
      )}
    </Page>
  )
}

function CarouselDocument({ carousel }: { carousel: Carousel }) {
  const total = carousel.slides.length
  return (
    <Document>
      {carousel.slides.map((slide, i) => (
        <Slide
          key={i}
          slide={slide}
          index={i}
          total={total}
          accentHex={carousel.accentHex}
          theme={carousel.theme}
          handle={carousel.handle}
        />
      ))}
    </Document>
  )
}

/** Rend un carrousel en PDF (Buffer). Accents garantis (Noto embarqué). */
export async function renderCarouselPdf(carousel: Carousel): Promise<Buffer> {
  registerPdfFonts()
  return renderToBuffer(<CarouselDocument carousel={carousel} />)
}
