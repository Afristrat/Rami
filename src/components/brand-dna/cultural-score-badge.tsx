import { getTranslations } from "next-intl/server"
import { CheckCircle2, TriangleAlert, Minus, ShieldCheck, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CulturalScoreResult, CulturalLevel } from "@/lib/services/brand-dna/cultural-scorer"

/* ─── Styles par niveau (cohérent avec le design dark RAMI) ─── */
const LEVEL_STYLES: Record<CulturalLevel, { text: string; bar: string; ring: string }> = {
  excellent: {
    text: "text-green-600 dark:text-green-400",
    bar: "bg-green-500",
    ring: "border-green-500/30",
  },
  good: {
    text: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-500",
    ring: "border-blue-500/30",
  },
  warning: {
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    ring: "border-amber-500/30",
  },
  poor: {
    text: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
    ring: "border-red-500/30",
  },
}

/**
 * Badge de cohérence culturelle (US-016) — score 0-100 d'alignement
 * palette × secteur (matrice Causse) + justification par couleur.
 * Server Component : résout les libellés i18n directement.
 */
export async function CulturalScoreBadge({ result }: { result: CulturalScoreResult }) {
  const t = await getTranslations("brandDna.culturalScore")
  const tColors = await getTranslations("brandDna.colors")
  const tReasons = await getTranslations("brandDna.sectorColorRules")
  const styles = LEVEL_STYLES[result.level]

  return (
    <div
      className={cn(
        "rounded-xl border p-4 bg-muted/30 dark:bg-white/5",
        styles.ring
      )}
      data-testid="cultural-score-badge"
    >
      {/* En-tête : titre + score */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className={cn("size-4 shrink-0", styles.text)} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{t("title")}</p>
            <p className={cn("text-[10px] font-semibold uppercase tracking-wider", styles.text)}>
              {t(`levels.${result.level}`)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={cn("text-2xl font-black tabular-nums", styles.text)}>
            {result.score}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold">/100</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 bg-muted dark:bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className={cn("h-full rounded-full transition-all duration-700", styles.bar)}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Secteur sans règle Causse documentée */}
      {!result.hasRules && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">{t("noRules")}</p>
      )}

      {/* Justifications par couleur */}
      {result.hasRules && result.justifications.length > 0 && (
        <ul className="space-y-1.5">
          {result.justifications.map((j) => {
            const colorName = tColors(`${j.colorId}.name`)
            if (j.verdict === "recommended") {
              return (
                <li key={j.colorId} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <CheckCircle2 className="size-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/80">
                    <span className="font-semibold text-foreground">{colorName}</span> — {t("recommended")}
                  </span>
                </li>
              )
            }
            if (j.verdict === "avoid") {
              const alternativeName = j.alternativeColorId
                ? tColors(`${j.alternativeColorId}.name`)
                : null
              return (
                <li key={j.colorId} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <TriangleAlert className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/80">
                    <span className="font-semibold text-foreground">{colorName}</span> — {t("avoid")}
                    {j.reasonKey && (
                      <span className="block text-muted-foreground italic">
                        {tReasons(j.reasonKey)}
                      </span>
                    )}
                    {alternativeName && (
                      <span className="inline-flex items-center gap-1 mt-0.5 text-foreground/70">
                        <ArrowRight className="size-3" />
                        {t("alternative", { color: alternativeName })}
                      </span>
                    )}
                  </span>
                </li>
              )
            }
            return (
              <li key={j.colorId} className="flex items-start gap-2 text-[11px] leading-relaxed">
                <Minus className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{colorName}</span> — {t("neutral")}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
