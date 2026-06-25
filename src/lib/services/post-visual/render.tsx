// ============================================================
// Rendu d'un POST VISUEL en image (PNG) via next/og (Satori + resvg).
// Texte composé par le CODE en vraie typo Noto → accents GARANTIS, zéro
// hallucination. Pur serveur (lit les polices dans public/fonts comme le PDF).
//
// Satori n'a pas de container-queries → on calcule des px absolus sur un canvas
// de 1080 de large (parité avec carousel-pdf : u(n) = n% de 1080).
// ============================================================

import type { ReactElement } from "react"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import {
  POST_DIMENSIONS,
  type PostVisual,
  type PostLayout,
  type BrandMark,
  type GestaltShapeKeyZ,
} from "@/lib/schemas/post-visual.schema"

// ── Polices (chargées une fois par process) ──────────────────────────────────

interface FontEntry {
  name: string
  data: ArrayBuffer
  weight: 400 | 700
  style: "normal"
}

let fontsCache: FontEntry[] | null = null

async function loadFonts(): Promise<FontEntry[]> {
  if (fontsCache) return fontsCache
  const dir = path.join(process.cwd(), "public", "fonts")
  const read = async (file: string): Promise<ArrayBuffer> => {
    const buf = await readFile(path.join(dir, file))
    // Buffer → ArrayBuffer (slice exact pour éviter le pool partagé de Node)
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  }
  fontsCache = [
    { name: "NotoSans", data: await read("NotoSans-Regular.ttf"), weight: 400, style: "normal" },
    { name: "NotoSans", data: await read("NotoSans-Bold.ttf"), weight: 700, style: "normal" },
    // Arabe : couverture des glyphes AR si le texte en contient (FR reste prioritaire).
    { name: "NotoSans", data: await read("NotoSansArabic-Regular.ttf"), weight: 400, style: "normal" },
    { name: "NotoSans", data: await read("NotoSansArabic-Bold.ttf"), weight: 700, style: "normal" },
  ]
  return fontsCache
}

// ── Palette (parité carousel : hex solides) ──────────────────────────────────

interface Palette {
  bg: string
  text: string
  muted: string
  panel: string
  hairline: string
}

function palette(theme: "dark" | "light"): Palette {
  return theme === "dark"
    ? { bg: "#0B0B0F", text: "#F4F4F5", muted: "#9CA3AF", panel: "#16161D", hairline: "#2A2A31" }
    : { bg: "#FBFBFD", text: "#0B0B0F", muted: "#6B7280", panel: "#F1F1F4", hairline: "#E4E4E8" }
}

/** Convertit un HEX #RRGGBB en rgba(...) avec l'alpha donné. */
function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ── Construction de l'élément JSX (Satori-compatible : flex + px absolus) ─────

const W = 1080
const u = (n: number): number => Math.round((n / 100) * W) // % de 1080 → px
const PAD = u(8)
const FOOTER_H = u(7)

function Footer({ handle, c, accentHex }: { handle: string | undefined; c: Palette; accentHex: string }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: FOOTER_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: PAD,
        paddingRight: PAD,
        borderTopWidth: 1,
        borderTopStyle: "solid",
        borderTopColor: c.hairline,
      }}
    >
      <div style={{ display: "flex", fontSize: u(2.8), color: c.muted }}>{handle ?? ""}</div>
      <div style={{ display: "flex", width: u(4), height: u(1), backgroundColor: accentHex, borderRadius: 999 }} />
    </div>
  )
}

function layoutBody(layout: PostLayout, c: Palette, accentHex: string): ReactElement {
  switch (layout.type) {
    case "headline":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          {layout.eyebrow ? (
            <div
              style={{
                display: "flex",
                fontSize: u(3.2),
                letterSpacing: u(0.6),
                color: accentHex,
                fontWeight: 700,
                marginBottom: u(3),
              }}
            >
              {layout.eyebrow.toUpperCase()}
            </div>
          ) : null}
          <div style={{ display: "flex", fontSize: u(7.6), fontWeight: 700, lineHeight: 1.08, letterSpacing: -1 }}>
            {layout.title}
          </div>
          {layout.subtitle ? (
            <div style={{ display: "flex", fontSize: u(3.8), color: c.muted, marginTop: u(4), lineHeight: 1.35 }}>
              {layout.subtitle}
            </div>
          ) : null}
        </div>
      )

    case "stat":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: u(22), fontWeight: 700, color: accentHex, lineHeight: 0.95, letterSpacing: -2 }}>
            {layout.value}
          </div>
          <div style={{ display: "flex", fontSize: u(5.4), fontWeight: 700, marginTop: u(2), lineHeight: 1.15 }}>
            {layout.label}
          </div>
          {layout.context ? (
            <div style={{ display: "flex", fontSize: u(3.6), color: c.muted, marginTop: u(4), lineHeight: 1.4 }}>
              {layout.context}
            </div>
          ) : null}
        </div>
      )

    case "quote":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: u(14), fontWeight: 700, color: accentHex, lineHeight: 0.8 }}>“</div>
          <div style={{ display: "flex", fontSize: u(5.8), fontWeight: 600, lineHeight: 1.3, marginTop: u(2) }}>
            {layout.text}
          </div>
          {layout.attribution ? (
            <div style={{ display: "flex", fontSize: u(3.4), color: c.muted, marginTop: u(4) }}>
              — {layout.attribution}
            </div>
          ) : null}
        </div>
      )

    case "checklist":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: u(5.6), fontWeight: 700, lineHeight: 1.15, marginBottom: u(5) }}>
            {layout.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {layout.items.map((item, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", marginBottom: u(3.2) }}>
                <div style={{ display: "flex", fontSize: u(3.8), fontWeight: 700, color: accentHex, marginRight: u(2.6), lineHeight: 1.3 }}>
                  ✓
                </div>
                <div style={{ display: "flex", fontSize: u(3.8), lineHeight: 1.35, flex: 1 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      )
  }
}

// ── Marque : pastille logo / monogramme + décor de forme Gestalt ──────────────

/** Rayon de la pastille de marque selon la forme Gestalt (psychologie des formes). */
function chipRadius(shape: GestaltShapeKeyZ): number {
  switch (shape) {
    case "cercle":
      return 999
    case "courbes":
      return u(4)
    case "carre":
      return u(1.2)
    default: // triangle / diagonales / grille → anguleux
      return u(0.6)
  }
}

/** Pastille de marque : logo si disponible, sinon monogramme sur fond d'accent. */
function BrandChip({ accentHex, brand }: { accentHex: string; brand: BrandMark }): ReactElement {
  const size = u(11)
  const radius = chipRadius(brand.shapeKey)
  return (
    <div
      style={{
        position: "absolute",
        top: u(4.5),
        left: PAD,
        display: "flex",
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: brand.logoDataUrl ? "transparent" : accentHex,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {brand.logoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoDataUrl} width={size} height={size} alt="" style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ display: "flex", fontSize: u(4.4), fontWeight: 700, color: brand.onAccent }}>{brand.monogram}</div>
      )}
    </div>
  )
}

/** Glyphe décoratif (coin haut-droit) matérialisant la forme Gestalt du secteur. */
function ShapeGlyph({ accentHex, shape }: { accentHex: string; shape: GestaltShapeKeyZ }): ReactElement | null {
  const S = u(16)
  const base = { position: "absolute" as const, top: u(5), right: PAD, display: "flex", opacity: 0.14 }
  const stroke = u(1.3)
  switch (shape) {
    case "cercle":
      return <div style={{ ...base, width: S, height: S, borderRadius: 999, borderWidth: stroke, borderStyle: "solid", borderColor: accentHex }} />
    case "carre":
      return <div style={{ ...base, width: S, height: S, borderWidth: stroke, borderStyle: "solid", borderColor: accentHex }} />
    case "triangle":
      return (
        <div
          style={{
            ...base,
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderLeftWidth: S / 2,
            borderRightWidth: S / 2,
            borderBottomWidth: S,
            borderTopWidth: 0,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: accentHex,
            borderTopColor: "transparent",
          }}
        />
      )
    case "diagonales":
      return <div style={{ ...base, top: u(9), width: S, height: u(2), backgroundColor: accentHex, transform: "rotate(-45deg)" }} />
    case "courbes":
      return <div style={{ ...base, width: S, height: S, borderTopLeftRadius: S, borderBottomRightRadius: S, borderWidth: stroke, borderStyle: "solid", borderColor: accentHex }} />
    case "grille":
      return (
        <div style={{ ...base, width: S, height: S, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignContent: "space-between" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", width: u(6.5), height: u(6.5), backgroundColor: accentHex }} />
          ))}
        </div>
      )
  }
}

function buildElement(card: PostVisual): ReactElement {
  const c = palette(card.theme)
  const hasBrand = card.brand != null
  // Fond teinté marque : voile d'accent qui s'estompe vers le fond de base
  // (subtil → le texte reste sur le fond de base, contraste préservé).
  const tint = card.theme === "dark" ? 0.22 : 0.12
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: c.bg,
        backgroundImage: `radial-gradient(120% 85% at 0% 0%, ${rgba(card.accentHex, tint)} 0%, ${c.bg} 48%, ${c.bg} 100%)`,
        color: c.text,
        fontFamily: "NotoSans",
      }}
    >
      {/* Barre d'accent supérieure */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: u(1.4), backgroundColor: card.accentHex, display: "flex" }} />
      {/* Décor de forme Gestalt (selon le secteur du tenant) */}
      {card.brand ? <ShapeGlyph accentHex={card.accentHex} shape={card.brand.shapeKey} /> : null}
      {/* Pastille de marque (logo ou monogramme) */}
      {card.brand ? <BrandChip accentHex={card.accentHex} brand={card.brand} /> : null}
      {/* Corps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingTop: hasBrand ? u(19) : u(10),
          paddingBottom: FOOTER_H + u(3),
          paddingLeft: PAD,
          paddingRight: PAD,
        }}
      >
        {layoutBody(card.layout, c, card.accentHex)}
      </div>
      <Footer handle={card.handle} c={c} accentHex={card.accentHex} />
    </div>
  )
}

/**
 * Rend la carte en PNG (Buffer). Le caller le passe à `storeVisual` (→ WebP +
 * watermark FREE + MinIO) en data URI.
 */
export async function renderPostVisualToPng(card: PostVisual): Promise<Buffer> {
  const { width, height } = POST_DIMENSIONS[card.format]
  const fonts = await loadFonts()
  const res = new ImageResponse(buildElement(card), {
    width,
    height,
    fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
  })
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/** PNG → data URI base64 (entrée de `storeVisual`). */
export async function renderPostVisualToDataUri(card: PostVisual): Promise<string> {
  const png = await renderPostVisualToPng(card)
  return `data:image/png;base64,${png.toString("base64")}`
}
