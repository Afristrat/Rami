"use client"

import { cn } from "@/lib/utils"
import { CAUSSE_COLORS, VOICE_TONES, type BrandDnaFormData } from "@/lib/schemas/brand-dna.schema"

/**
 * Calcule un score de complétude Brand DNA entre 0 et 1.
 * Chaque dimension contribue à son poids :
 *   - Identité complète (nom + secteur + positionnement + tagline) : 25%
 *   - Logo uploadé : 15%
 *   - Palette Causse 3 couleurs : 25%
 *   - Ton de voix : 15%
 *   - Audience complète (description + âge + géo + pain points) : 20%
 */
export function computeDnaScore(data: Partial<BrandDnaFormData>): number {
  let score = 0

  // Identité (25%)
  if (data.brandName && data.brandName.length >= 1) score += 0.1
  if (data.sector && data.sector.length > 0) score += 0.05
  if (data.positioning && data.positioning.length >= 10) score += 0.07
  if (data.tagline && data.tagline.length > 0) score += 0.03

  // Logo (15%)
  if (data.logoDataUrl && data.logoDataUrl.length > 0) score += 0.15

  // Palette (25%)
  if (data.colorPrimary) score += 0.1
  if (data.colorSecondary) score += 0.08
  if (data.colorAccent) score += 0.07

  // Ton (15%)
  if (data.voiceTone) score += 0.15

  // Audience (20%)
  if (data.audienceDescription && data.audienceDescription.length >= 20) score += 0.1
  if (data.audienceAge && data.audienceAge.length > 0) score += 0.04
  if (data.audienceLocation && data.audienceLocation.length > 0) score += 0.04
  if (data.audiencePainPoints && data.audiencePainPoints.length > 0) score += 0.02

  return Math.min(Math.round(score * 100) / 100, 1)
}

function getScoreLevel(score: number): {
  label: string
  color: string
  bgColor: string
  borderColor: string
  description: string
} {
  if (score >= 0.85) {
    return {
      label: "Excellent",
      color: "text-green-700 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/40",
      borderColor: "border-green-200 dark:border-green-900/60",
      description: "Votre Brand DNA est complet. RAMI génèrera du contenu hautement calibré.",
    }
  }
  if (score >= 0.65) {
    return {
      label: "Bon",
      color: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-900/60",
      description: "Bon niveau de détail. Ajoutez logo et audience pour optimiser les générations.",
    }
  }
  if (score >= 0.40) {
    return {
      label: "En cours",
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      borderColor: "border-amber-200 dark:border-amber-900/60",
      description: "Continuez à remplir les informations pour améliorer la précision des visuels.",
    }
  }
  return {
    label: "Incomplet",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    borderColor: "border-border",
    description: "Complétez le formulaire pour que RAMI puisse calibrer votre contenu.",
  }
}

interface DnaScoreBadgeProps {
  data: Partial<BrandDnaFormData>
  className?: string
}

export function DnaScoreBadge({ data, className }: DnaScoreBadgeProps) {
  const score = computeDnaScore(data)
  const percentage = Math.round(score * 100)
  const level = getScoreLevel(score)

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
            Score Brand DNA — {level.label}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
          {level.description}
        </p>

        {/* Éléments manquants */}
        {score < 0.85 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {!data.logoDataUrl && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                + Logo (+15%)
              </span>
            )}
            {!data.colorPrimary && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                + Palette (+25%)
              </span>
            )}
            {!data.voiceTone && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                + Ton de voix (+15%)
              </span>
            )}
            {(!data.audienceDescription || data.audienceDescription.length < 20) && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                + Audience (+10%)
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
  const percentage = Math.round(score * 100)
  const level = getScoreLevel(score)

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
        Score DNA : {percentage}%
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
  const colors = [primaryId, secondaryId, accentId]
    .map((id) => CAUSSE_COLORS.find((c) => c.id === id))
    .filter(Boolean)

  if (colors.length === 0) return null

  return (
    <div className="flex gap-2">
      {colors.map((color, i) => {
        if (!color) return null
        const roles = ["Principale", "Secondaire", "Accent"]
        return (
          <div key={i} className="flex-1 space-y-1">
            <div
              className="h-8 rounded-lg shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: color.hex }}
              title={`${color.name} — ${color.emotion}`}
            />
            <p className="truncate text-center text-[9px] font-medium text-muted-foreground">
              {roles[i]}
            </p>
            <p className="truncate text-center text-[9px] text-muted-foreground/70">
              {color.name}
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
  const tone = VOICE_TONES.find((t) => t.id === toneId)
  if (!tone) return null

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1">
      <span className="text-sm">{tone.icon}</span>
      <span className="text-xs font-medium text-foreground">{tone.label}</span>
    </div>
  )
}
