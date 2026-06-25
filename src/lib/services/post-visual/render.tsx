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

function buildElement(card: PostVisual): ReactElement {
  const c = palette(card.theme)
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: c.bg,
        color: c.text,
        fontFamily: "NotoSans",
      }}
    >
      {/* Barre d'accent supérieure */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: u(1.4), backgroundColor: card.accentHex, display: "flex" }} />
      {/* Corps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingTop: u(10),
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
