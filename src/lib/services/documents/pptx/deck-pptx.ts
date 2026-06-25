// ============================================================
// Génération PPTX d'un deck (pptxgenjs, pur JS — compatible Nixpacks)
// Mise en page inspirée du style « cabinet de conseil » (McKinsey) : barre
// d'accent, titres nets, puces sobres, pied de page paginé.
// ============================================================

import PptxGenJS from "pptxgenjs"
import type { DeckSlide, PresentationContent } from "@/lib/schemas/presentation.schema"

const SLATE = "1E293B"
const GREY = "64748B"

function hex(color: string): string {
  return color.replace(/^#/, "").toUpperCase()
}

/** Construit le .pptx en mémoire et le renvoie en Buffer Node. */
export async function buildDeckPptx(content: PresentationContent, title: string): Promise<Buffer> {
  const pptx = new PptxGenJS()
  pptx.layout = "LAYOUT_WIDE" // 13.33 x 7.5 in
  pptx.author = "RAMI by AI-MPower"
  pptx.title = title

  const accent = hex(content.theme.accentColor || "#7C3BED")
  const onAccent = hex(content.theme.onAccent || "#FFFFFF")
  const logo =
    typeof content.theme.logoDataUrl === "string" && content.theme.logoDataUrl.startsWith("data:image/")
      ? content.theme.logoDataUrl
      : null
  const monogram = (content.theme.monogram ?? "").slice(0, 3)
  const shapeKey = content.theme.shapeKey ?? "cercle"
  const slides = content.deck.slides
  const total = slides.length

  slides.forEach((slide, idx) => {
    const s = pptx.addSlide()
    s.background = { color: "FFFFFF" }
    // Barre d'accent haute (couleur de marque)
    s.addShape("rect", { x: 0, y: 0, w: "100%", h: 0.12, fill: { color: accent } })

    renderSlide(s, slide, idx, total, accent)

    // Marque (logo ou monogramme) en haut à droite — identité sur CHAQUE slide.
    brandMark(s, { logo, monogram, accent, onAccent, shapeKey })

    // Pied de page
    s.addText("RAMI", { x: 0.5, y: 7.05, w: 3, h: 0.3, fontSize: 9, color: GREY })
    s.addText(`${idx + 1} / ${total}`, { x: 9.83, y: 7.05, w: 3, h: 0.3, fontSize: 9, color: GREY, align: "right" })
  })

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer
  return out
}

type Slide = ReturnType<PptxGenJS["addSlide"]>

/** Forme de la pastille de marque selon la forme Gestalt du secteur. */
function chipShape(shapeKey: string): "ellipse" | "rect" | "roundRect" {
  if (shapeKey === "cercle" || shapeKey === "courbes") return "ellipse"
  if (shapeKey === "carre" || shapeKey === "grille") return "rect"
  return "roundRect"
}

/**
 * Pastille de marque (haut-droit de chaque slide) : logo du tenant si disponible,
 * sinon monogramme sur fond d'accent. Garantit la présence de l'identité partout.
 */
function brandMark(
  s: Slide,
  opts: { logo: string | null; monogram: string; accent: string; onAccent: string; shapeKey: string }
): void {
  const x = 12.45
  const y = 0.3
  const d = 0.58
  if (opts.logo) {
    s.addImage({ data: opts.logo, x, y, w: d, h: d })
    return
  }
  if (!opts.monogram) return
  s.addShape(chipShape(opts.shapeKey), { x, y, w: d, h: d, fill: { color: opts.accent } })
  s.addText(opts.monogram, {
    x,
    y,
    w: d,
    h: d,
    fontSize: 13,
    bold: true,
    color: opts.onAccent,
    align: "center",
    valign: "middle",
  })
}

function renderSlide(s: Slide, slide: DeckSlide, idx: number, total: number, accent: string): void {
  switch (slide.type) {
    case "cover": {
      s.addShape("rect", { x: 0.6, y: 2.6, w: 1.2, h: 0.08, fill: { color: accent } })
      s.addText(slide.title, { x: 0.6, y: 2.8, w: 12.1, h: 1.6, fontSize: 40, bold: true, color: accent })
      if (slide.subtitle) {
        s.addText(slide.subtitle, { x: 0.6, y: 4.5, w: 12.1, h: 1, fontSize: 18, color: GREY })
      }
      break
    }
    case "section": {
      s.addText(String(idx + 1).padStart(2, "0"), { x: 0.6, y: 2.6, w: 3, h: 0.6, fontSize: 16, bold: true, color: accent })
      s.addText(slide.title, { x: 0.6, y: 3.1, w: 12.1, h: 1.4, fontSize: 34, bold: true, color: SLATE })
      if (slide.subtitle) {
        s.addText(slide.subtitle, { x: 0.6, y: 4.6, w: 12.1, h: 1, fontSize: 16, color: GREY })
      }
      break
    }
    case "agenda": {
      s.addText(slide.title, { x: 0.6, y: 0.5, w: 12.1, h: 0.9, fontSize: 28, bold: true, color: SLATE })
      s.addText(
        slide.items.map((it, i) => ({ text: `${i + 1}.  ${it}`, options: { bullet: false, color: SLATE, fontSize: 18, paraSpaceAfter: 10 } })),
        { x: 0.8, y: 1.7, w: 11.7, h: 5 }
      )
      break
    }
    case "content":
    case "conclusion": {
      s.addText(slide.title, { x: 0.6, y: 0.5, w: 12.1, h: 0.9, fontSize: 28, bold: true, color: SLATE })
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, color: SLATE, fontSize: 16, paraSpaceAfter: 8 } })),
        { x: 0.8, y: 1.7, w: 11.7, h: 5 }
      )
      break
    }
    case "twoColumn": {
      s.addText(slide.title, { x: 0.6, y: 0.5, w: 12.1, h: 0.9, fontSize: 28, bold: true, color: SLATE })
      const cols = [
        { t: slide.leftTitle, items: slide.left, x: 0.6 },
        { t: slide.rightTitle, items: slide.right, x: 6.83 },
      ]
      cols.forEach((c) => {
        s.addText(c.t, { x: c.x, y: 1.7, w: 5.9, h: 0.5, fontSize: 16, bold: true, color: accent })
        s.addText(
          c.items.map((b) => ({ text: b, options: { bullet: { code: "2022" }, color: SLATE, fontSize: 13, paraSpaceAfter: 6 } })),
          { x: c.x, y: 2.3, w: 5.9, h: 4.3 }
        )
      })
      break
    }
    case "stat": {
      s.addText(slide.stat, { x: 0.6, y: 2.3, w: 12.1, h: 1.6, fontSize: 72, bold: true, color: accent, align: "center" })
      s.addText(slide.title, { x: 0.6, y: 4.1, w: 12.1, h: 0.8, fontSize: 24, bold: true, color: SLATE, align: "center" })
      if (slide.caption) {
        s.addText(slide.caption, { x: 1.6, y: 5, w: 10.1, h: 1, fontSize: 14, color: GREY, align: "center" })
      }
      break
    }
    case "quote": {
      s.addText("“", { x: 0.6, y: 1.4, w: 2, h: 1.2, fontSize: 80, bold: true, color: accent })
      s.addText(slide.quote, { x: 1, y: 2.8, w: 11.3, h: 2.5, fontSize: 26, italic: true, bold: true, color: SLATE })
      if (slide.author) {
        s.addText(`— ${slide.author}`, { x: 1, y: 5.4, w: 11.3, h: 0.6, fontSize: 16, color: GREY })
      }
      break
    }
  }
}
