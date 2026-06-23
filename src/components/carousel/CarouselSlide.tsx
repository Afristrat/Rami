// ============================================================
// Rendu d'UNE slide de carrousel en 4:5 (1080×1350) — design soigné.
// Source unique de vérité du design (aperçu + base du PDF). Scaling parfait
// via container queries (cqw) : identique en miniature ou plein écran.
// Pas de hook → utilisable côté serveur comme client.
// ============================================================

import type { CarouselSlide as Slide } from "@/lib/schemas/carousel.schema"

export interface CarouselSlideProps {
  slide: Slide
  index: number // 0-based
  total: number
  accentHex: string
  theme: "dark" | "light"
  handle?: string
}

type Palette = {
  bg: string
  text: string
  muted: string
  panel: string
  hairline: string
}

function palette(theme: "dark" | "light"): Palette {
  return theme === "dark"
    ? { bg: "#0B0B0F", text: "#F4F4F5", muted: "#9CA3AF", panel: "rgba(255,255,255,0.05)", hairline: "rgba(255,255,255,0.10)" }
    : { bg: "#FBFBFD", text: "#0B0B0F", muted: "#6B7280", panel: "rgba(0,0,0,0.04)", hairline: "rgba(0,0,0,0.10)" }
}

export function CarouselSlide({ slide, index, total, accentHex, theme, handle }: CarouselSlideProps) {
  const c = palette(theme)
  const isCover = slide.type === "cover"

  return (
    <div
      style={{
        containerType: "size",
        aspectRatio: "4 / 5",
        background:
          theme === "dark"
            ? `radial-gradient(120% 80% at 0% 0%, ${accentHex}22 0%, ${c.bg} 45%, ${c.bg} 100%)`
            : `radial-gradient(120% 80% at 0% 0%, ${accentHex}14 0%, ${c.bg} 45%, ${c.bg} 100%)`,
        color: c.text,
      }}
      className="relative w-full overflow-hidden"
    >
      {/* Barre d'accent supérieure */}
      <div style={{ height: "1.4cqw", background: accentHex }} className="absolute inset-x-0 top-0" />

      {/* Corps */}
      <div
        style={{ padding: "8cqw", paddingTop: "9cqw", paddingBottom: isCover ? "8cqw" : "13cqw" }}
        className="flex h-full flex-col"
      >
        {slide.type === "cover" && (
          <div className="flex flex-1 flex-col justify-center">
            {slide.eyebrow && (
              <div
                style={{ fontSize: "3.2cqw", letterSpacing: "0.18em", color: accentHex }}
                className="mb-[3cqw] font-bold uppercase"
              >
                {slide.eyebrow}
              </div>
            )}
            <h1 style={{ fontSize: "11cqw", lineHeight: 1.05 }} className="font-extrabold tracking-tight">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p style={{ fontSize: "4.4cqw", color: c.muted, marginTop: "4cqw", lineHeight: 1.35 }}>
                {slide.subtitle}
              </p>
            )}
            <div style={{ marginTop: "auto" }}>
              <div style={{ height: "0.5cqw", width: "16cqw", background: accentHex }} className="rounded-full" />
              {slide.author && (
                <p style={{ fontSize: "3.4cqw", color: c.muted, marginTop: "3cqw" }}>{slide.author}</p>
              )}
            </div>
          </div>
        )}

        {slide.type === "point" && (
          <div className="flex flex-1 flex-col">
            <div className="flex items-baseline" style={{ gap: "3cqw" }}>
              {slide.index && (
                <span style={{ fontSize: "9cqw", color: accentHex, lineHeight: 1 }} className="font-extrabold">
                  {slide.index}
                </span>
              )}
              <h2 style={{ fontSize: "7.2cqw", lineHeight: 1.1 }} className="font-bold tracking-tight">
                {slide.heading}
              </h2>
            </div>
            {slide.body && (
              <p style={{ fontSize: "4.4cqw", color: c.muted, marginTop: "5cqw", lineHeight: 1.45 }}>
                {slide.body}
              </p>
            )}
            {slide.bullets && slide.bullets.length > 0 && (
              <ul style={{ marginTop: "5cqw" }} className="flex flex-col" >
                {slide.bullets.map((b, i) => (
                  <li key={i} style={{ fontSize: "4.2cqw", marginBottom: "3cqw", gap: "3cqw" }} className="flex items-start">
                    <span style={{ color: accentHex, lineHeight: 1.3 }} className="font-bold">→</span>
                    <span style={{ lineHeight: 1.35 }}>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {slide.type === "stat" && (
          <div className="flex flex-1 flex-col justify-center">
            <div style={{ fontSize: "24cqw", color: accentHex, lineHeight: 0.95 }} className="font-extrabold tracking-tight">
              {slide.value}
            </div>
            <div style={{ fontSize: "6cqw", marginTop: "2cqw", lineHeight: 1.15 }} className="font-bold">
              {slide.label}
            </div>
            {slide.context && (
              <p style={{ fontSize: "4cqw", color: c.muted, marginTop: "4cqw", lineHeight: 1.4 }}>{slide.context}</p>
            )}
          </div>
        )}

        {slide.type === "quote" && (
          <div className="flex flex-1 flex-col justify-center">
            <div style={{ fontSize: "16cqw", color: accentHex, lineHeight: 0.8 }} className="font-serif">“</div>
            <p style={{ fontSize: "6.4cqw", lineHeight: 1.3, marginTop: "2cqw" }} className="font-semibold">
              {slide.text}
            </p>
            {slide.attribution && (
              <p style={{ fontSize: "3.6cqw", color: c.muted, marginTop: "4cqw" }}>— {slide.attribution}</p>
            )}
          </div>
        )}

        {slide.type === "comparison" && (
          <div className="flex flex-1 flex-col justify-center" style={{ gap: "4cqw" }}>
            {[
              { title: slide.leftTitle, items: slide.leftItems, accent: false },
              { title: slide.rightTitle, items: slide.rightItems, accent: true },
            ].map((col, ci) => (
              <div
                key={ci}
                style={{ background: c.panel, border: `1px solid ${col.accent ? accentHex + "55" : c.hairline}`, borderRadius: "3cqw", padding: "5cqw" }}
              >
                <div
                  style={{ fontSize: "3.4cqw", letterSpacing: "0.12em", color: col.accent ? accentHex : c.muted }}
                  className="mb-[3cqw] font-bold uppercase"
                >
                  {col.title}
                </div>
                <ul className="flex flex-col">
                  {col.items.map((it, i) => (
                    <li key={i} style={{ fontSize: "4cqw", marginBottom: "2cqw", gap: "2.5cqw", lineHeight: 1.3 }} className="flex items-start">
                      <span style={{ color: col.accent ? accentHex : c.muted }}>•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {slide.type === "cta" && (
          <div className="flex flex-1 flex-col justify-center">
            <h2 style={{ fontSize: "8.5cqw", lineHeight: 1.1 }} className="font-extrabold tracking-tight">
              {slide.heading}
            </h2>
            {slide.body && (
              <p style={{ fontSize: "4.4cqw", color: c.muted, marginTop: "4cqw", lineHeight: 1.4 }}>{slide.body}</p>
            )}
            {slide.action && (
              <div
                style={{ background: accentHex, color: theme === "dark" ? "#0B0B0F" : "#FFFFFF", fontSize: "4.2cqw", padding: "3.5cqw 6cqw", marginTop: "6cqw" }}
                className="inline-block self-start rounded-full font-bold"
              >
                {slide.action}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pied de page : handle + n° de slide (sauf cover) */}
      {!isCover && (
        <div
          style={{ padding: "0 8cqw", height: "9cqw", borderTop: `1px solid ${c.hairline}` }}
          className="absolute inset-x-0 bottom-0 flex items-center justify-between"
        >
          <span style={{ fontSize: "3cqw", color: c.muted }} className="font-medium">
            {handle ?? ""}
          </span>
          <span style={{ fontSize: "3cqw", color: c.muted }} className="font-semibold tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  )
}
