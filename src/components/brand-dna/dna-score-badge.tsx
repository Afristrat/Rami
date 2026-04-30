"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { CAUSSE_COLORS, VOICE_TONES, type BrandDnaFormData } from "@/lib/schemas/brand-dna.schema"
import { computeDnaScore, getDnaScoreLevel } from "@/lib/utils/dna-score"

export { computeDnaScore }

interface DnaScoreBadgeProps {
  data: Partial<BrandDnaFormData>
  className?: string
}

export function DnaScoreBadge({ data, className }: DnaScoreBadgeProps) {
  const t = useTranslations("brandDna.form")
  const tScore = useTranslations("brandDna.scoreLevel")
  const score = computeDnaScore(data)
  const percentage = Math.round(score * 100)
  const level = getDnaScoreLevel(score)

  // Dimensions du cercle SVG
  const size = 56
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - score * circumference

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border p-4",
        level.bgColor,
        level.borderColor,
        className
      )}
    >
      {/* Cercle de score SVG */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border opacity-30"
          />
          {/* Progression */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={cn(
              "transition-all duration-700",
              score >= 0.85 ? "text-green-500" :
              score >= 0.65 ? "text-blue-500" :
              score >= 0.40 ? "text-amber-500" :
              "text-muted-foreground/50"
            )}
          />
        </svg>
        {/* Pourcentage centré */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-xs font-bold tabular-nums", level.color)}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Texte */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("text-sm font-semibold", level.color)}>
            {t("scoreBrandDnaWithLevel", { level: tScore(`${level.labelKey}.label`) })}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
          {tScore(`${level.descriptionKey}.description`)}
        </p>

        {/* Éléments manquants */}
        {score < 0.85 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {!data.logoDataUrl && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t("missingLogo")}
              </span>
            )}
            {!data.colorPrimary && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t("missingPalette")}
              </span>
            )}
            {!data.voiceTone && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t("missingVoiceTone")}
              </span>
            )}
            {!data.objectifsCognitifs?.length && !data.objectifCognitif && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t("missingCognitiveObj")}
              </span>
            )}
            {(!data.audienceDescription || data.audienceDescription.length < 20) && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t("missingAudience")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Version compacte pour l'affichage dans le récapitulatif.
 */
export function DnaScoreCompact({ score }: { score: number }) {
  const t = useTranslations("brandDna.form")
  const tScore = useTranslations("brandDna.scoreLevel")
  const percentage = Math.round(score * 100)
  const level = getDnaScoreLevel(score)

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1", level.bgColor, level.borderColor)}>
      <div
        className={cn("size-1.5 rounded-full", {
          "bg-green-500": score >= 0.85,
          "bg-blue-500": score >= 0.65 && score < 0.85,
          "bg-amber-500": score >= 0.40 && score < 0.65,
          "bg-muted-foreground/50": score < 0.40,
        })}
      />
      <span className={cn("text-[11px] font-semibold", level.color)}>
        {t("scoreDna", { pct: percentage })}
      </span>
    </div>
  )
}

/**
 * Résumé des couleurs sélectionnées avec leurs noms psychologiques.
 */
export function ColorPaletteSummary({
  primaryId,
  secondaryId,
  accentId,
}: {
  primaryId: string
  secondaryId: string
  accentId: string
}) {
  const tPicker = useTranslations("brandDna.colorPicker")
  const tColors = useTranslations("brandDna.colors")
  const colors = [primaryId, secondaryId, accentId]
    .map((id) => CAUSSE_COLORS.find((c) => c.id === id))
    .filter(Boolean)

  if (colors.length === 0) return null

  const roles = [tPicker("rolePrimary"), tPicker("roleSecondary"), tPicker("roleAccent")]

  return (
    <div className="flex gap-2">
      {colors.map((color, i) => {
        if (!color) return null
        return (
          <div key={i} className="flex-1 space-y-1">
            <div
              className="h-8 rounded-lg shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: color.hex }}
              title={`${tColors(`${color.id}.name`)} — ${tColors(`${color.id}.emotion`)}`}
            />
            <p className="truncate text-center text-[9px] font-medium text-muted-foreground">
              {roles[i]}
            </p>
            <p className="truncate text-center text-[9px] text-muted-foreground/70">
              {tColors(`${color.id}.name`)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Badge ton de voix avec emoji et label.
 */
export function VoiceToneBadge({ toneId }: { toneId: string }) {
  const tTones = useTranslations("brandDna.voiceTones")
  const tone = VOICE_TONES.find((t) => t.id === toneId)
  if (!tone) return null

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1">
      <span className="text-sm">{tone.icon}</span>
      <span className="text-xs font-medium text-foreground">{tTones(`${tone.id}.label`)}</span>
    </div>
  )
}
