"use client"

import type { DeckSlide } from "@/lib/schemas/presentation.schema"

// Rend une slide RÉELLE (issue du deck généré) dans un cadre 16:9.
// `variant="full"` = aperçu principal ; `variant="thumb"` = vignette compacte.

interface SlideRendererProps {
  slide: DeckSlide
  index: number
  total: number
  accentColor: string
  variant?: "full" | "thumb"
}

export function SlideRenderer({ slide, index, total, accentColor, variant = "full" }: SlideRendererProps) {
  const isThumb = variant === "thumb"
  const pad = isThumb ? "p-3" : "p-8 md:p-12"
  const titleSize = isThumb ? "text-[11px] font-bold leading-tight" : "text-2xl md:text-4xl font-black leading-tight"
  const bodySize = isThumb ? "text-[7px] leading-tight" : "text-sm md:text-base leading-relaxed"
  const subSize = isThumb ? "text-[8px]" : "text-base md:text-lg"

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-white dark:bg-slate-950 flex flex-col"
      style={{ borderTop: `${isThumb ? 3 : 8}px solid ${accentColor}` }}
    >
      <div className={`flex-1 flex flex-col ${pad} min-h-0`}>
        {slide.type === "cover" && (
          <div className="flex flex-1 flex-col justify-center gap-3">
            <div className="h-1 w-12 rounded-full" style={{ backgroundColor: accentColor }} />
            <h1 className={titleSize} style={{ color: accentColor }}>{slide.title}</h1>
            {slide.subtitle && <p className={`${subSize} text-slate-500 dark:text-slate-400`}>{slide.subtitle}</p>}
          </div>
        )}

        {slide.type === "section" && (
          <div className="flex flex-1 flex-col justify-center gap-2">
            <span className={`${isThumb ? "text-[7px]" : "text-xs"} font-bold uppercase tracking-widest`} style={{ color: accentColor }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <h1 className={titleSize}>{slide.title}</h1>
            {slide.subtitle && <p className={`${subSize} text-slate-500 dark:text-slate-400`}>{slide.subtitle}</p>}
          </div>
        )}

        {slide.type === "agenda" && (
          <div className="flex flex-1 flex-col gap-2">
            <h2 className={titleSize}>{slide.title}</h2>
            <ol className={`mt-2 space-y-1 ${bodySize}`}>
              {slide.items.map((it, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold" style={{ color: accentColor }}>{i + 1}.</span>
                  <span className="text-slate-700 dark:text-slate-300">{it}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {(slide.type === "content" || slide.type === "conclusion") && (
          <div className="flex flex-1 flex-col gap-2">
            <h2 className={titleSize}>{slide.title}</h2>
            <ul className={`mt-2 space-y-1.5 ${bodySize}`}>
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
                  <span className="text-slate-700 dark:text-slate-300">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {slide.type === "twoColumn" && (
          <div className="flex flex-1 flex-col gap-2 min-h-0">
            <h2 className={titleSize}>{slide.title}</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 flex-1 min-h-0">
              {([{ t: slide.leftTitle, items: slide.left }, { t: slide.rightTitle, items: slide.right }]).map((col, ci) => (
                <div key={ci} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 md:p-3">
                  <p className={`${isThumb ? "text-[8px]" : "text-sm"} font-bold mb-1`} style={{ color: accentColor }}>{col.t}</p>
                  <ul className={`space-y-1 ${bodySize}`}>
                    {col.items.map((b, i) => (
                      <li key={i} className="text-slate-700 dark:text-slate-300">• {b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.type === "stat" && (
          <div className="flex flex-1 flex-col justify-center items-center text-center gap-2">
            <p className={`${isThumb ? "text-[24px]" : "text-6xl md:text-7xl"} font-black`} style={{ color: accentColor }}>{slide.stat}</p>
            <h2 className={`${isThumb ? "text-[10px]" : "text-xl md:text-2xl"} font-bold`}>{slide.title}</h2>
            {slide.caption && <p className={`${bodySize} text-slate-500 dark:text-slate-400 max-w-md`}>{slide.caption}</p>}
          </div>
        )}

        {slide.type === "quote" && (
          <div className="flex flex-1 flex-col justify-center gap-3">
            <span className={`${isThumb ? "text-3xl" : "text-7xl"} font-black leading-none`} style={{ color: accentColor }}>&ldquo;</span>
            <p className={`${isThumb ? "text-[10px]" : "text-xl md:text-2xl"} font-semibold italic text-slate-800 dark:text-slate-200`}>{slide.quote}</p>
            {slide.author && <p className={`${subSize} text-slate-500 dark:text-slate-400`}>— {slide.author}</p>}
          </div>
        )}
      </div>

      {/* Pied de slide */}
      {!isThumb && (
        <div className="flex items-center justify-between px-8 pb-4 text-[10px] text-slate-400">
          <span>RAMI</span>
          <span>{index + 1} / {total}</span>
        </div>
      )}
    </div>
  )
}
