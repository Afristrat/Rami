"use client"

import { AlertTriangle, Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CAUSSE_COLORS,
  SECTOR_COLOR_RULES,
  CULTURE_COLOR_NOTES,
  CULTURES,
  type CausseColor,
} from "@/lib/schemas/brand-dna.schema"

interface ColorSwatchProps {
  color: CausseColor
  selected: boolean
  disabled?: boolean
  onSelect: (id: string) => void
  showBadge?: "primary" | "secondary" | "accent"
  isRecommended?: boolean
  isAvoided?: boolean
}

function ColorSwatch({
  color,
  selected,
  disabled,
  onSelect,
  showBadge,
  isRecommended,
  isAvoided,
}: ColorSwatchProps) {
  const badgeLabel = {
    primary: "Principale",
    secondary: "Secondaire",
    accent: "Accent",
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(color.id)}
      aria-label={`${color.name} — ${color.emotion}${selected ? " (sélectionnée)" : ""}${disabled ? " (déjà utilisée)" : ""}${isRecommended ? " (recommandée pour votre secteur)" : ""}${isAvoided ? " (déconseillée pour votre secteur)" : ""}`}
      aria-pressed={selected}
      aria-disabled={disabled}
      className={cn(
        "group relative w-full rounded-xl border-2 p-3 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : isAvoided && !disabled
            ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
            : isRecommended && !disabled
              ? "border-green-400/50 bg-green-50/50 hover:border-green-500 dark:bg-green-950/20 dark:border-green-700/50"
              : disabled
                ? "cursor-not-allowed border-border opacity-40"
                : "border-border hover:border-primary/40 hover:bg-muted/50"
      )}
      title={color.psycho}
    >
      {/* Badge rôle sélectionné */}
      {showBadge && (
        <span className="absolute -right-2 -top-2 z-10 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {badgeLabel[showBadge]}
        </span>
      )}

      {/* Badge recommandé secteur */}
      {isRecommended && !selected && !disabled && (
        <span className="absolute -left-1.5 -top-1.5 z-10 flex items-center gap-0.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          <Star className="size-2.5" />
          Conseillé
        </span>
      )}

      {/* Badge déconseillé secteur */}
      {isAvoided && !selected && !disabled && (
        <span className="absolute -left-1.5 -top-1.5 z-10 flex items-center gap-0.5 rounded-full bg-destructive/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          <AlertTriangle className="size-2.5" />
          Éviter
        </span>
      )}

      <div className="flex items-center gap-3">
        {/* Swatch couleur */}
        <div
          className="relative size-9 shrink-0 rounded-lg shadow-sm"
          style={{ backgroundColor: color.hex }}
        >
          {selected && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
              <Check className="size-4 text-white drop-shadow" />
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground leading-tight">{color.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">{color.emotion}</p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wider">
            {color.hex}
          </p>
        </div>
      </div>
    </button>
  )
}

interface ColorPalettePickerProps {
  primary: string
  secondary: string
  accent: string
  sector?: string
  primaryCulture?: string
  onChangePrimary: (id: string) => void
  onChangeSecondary: (id: string) => void
  onChangeAccent: (id: string) => void
  errors?: { primary?: string; secondary?: string; accent?: string }
}

export function ColorPalettePicker({
  primary,
  secondary,
  accent,
  sector,
  primaryCulture,
  onChangePrimary,
  onChangeSecondary,
  onChangeAccent,
  errors,
}: ColorPalettePickerProps) {
  const selectedIds = new Set([primary, secondary, accent].filter(Boolean))

  // Règles Causse pour le secteur sélectionné
  const sectorRules = sector ? SECTOR_COLOR_RULES[sector] : undefined
  const recommendedIds = new Set(sectorRules?.recommended ?? [])
  const avoidedIds = new Set(sectorRules?.avoid ?? [])

  const getColorById = (id: string) => CAUSSE_COLORS.find((c) => c.id === id)

  const primaryColor = getColorById(primary)
  const secondaryColor = getColorById(secondary)
  const accentColor = getColorById(accent)

  return (
    <div className="space-y-6">
      {/* Aperçu palette */}
      {(primary || secondary || accent) && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Aperçu de votre palette
          </p>
          <div className="flex gap-3">
            {[
              { color: primaryColor, role: "Principale", handler: onChangePrimary },
              { color: secondaryColor, role: "Secondaire", handler: onChangeSecondary },
              { color: accentColor, role: "Accent", handler: onChangeAccent },
            ].map(({ color, role }) =>
              color ? (
                <div key={role} className="flex-1 space-y-1.5">
                  <div
                    className="h-12 rounded-lg shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-center text-[10px] font-medium text-muted-foreground">
                    {role}
                  </p>
                  <p className="text-center text-[10px] text-muted-foreground/70 truncate px-1">
                    {color.name}
                  </p>
                </div>
              ) : (
                <div key={role} className="flex-1 space-y-1.5">
                  <div className="h-12 rounded-lg border-2 border-dashed border-border" />
                  <p className="text-center text-[10px] text-muted-foreground/50">{role}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Sélecteur — 3 colonnes étiquetées */}
      {[
        {
          label: "Couleur principale",
          description: "Dominante, utilisée sur 60% de vos visuels",
          selected: primary,
          onChange: onChangePrimary,
          role: "primary" as const,
          error: errors?.primary,
        },
        {
          label: "Couleur secondaire",
          description: "Complémentaire, utilisée sur 30% des surfaces",
          selected: secondary,
          onChange: onChangeSecondary,
          role: "secondary" as const,
          error: errors?.secondary,
        },
        {
          label: "Couleur d'accent",
          description: "CTA et moments clés, utilisée sur 10% des visuels",
          selected: accent,
          onChange: onChangeAccent,
          role: "accent" as const,
          error: errors?.accent,
        },
      ].map(({ label, description, selected, onChange, role, error }) => (
        <div key={role} className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
          {/* Légende recommandations si un secteur est choisi */}
          {sectorRules && (recommendedIds.size > 0 || avoidedIds.size > 0) && (
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              {recommendedIds.size > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-3 text-green-500" />
                  Conseillé pour {sector}
                </span>
              )}
              {avoidedIds.size > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="size-3 text-destructive/70" />
                  À éviter — raison neuropsychologique
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CAUSSE_COLORS.map((color) => {
              const isSelected = selected === color.id
              const isUsedElsewhere = selectedIds.has(color.id) && !isSelected
              return (
                <ColorSwatch
                  key={color.id}
                  color={color}
                  selected={isSelected}
                  disabled={isUsedElsewhere}
                  onSelect={onChange}
                  showBadge={isSelected ? role : undefined}
                  isRecommended={recommendedIds.has(color.id) && !isUsedElsewhere}
                  isAvoided={avoidedIds.has(color.id) && !isUsedElsewhere && !isSelected}
                />
              )
            })}
          </div>

          {/* Alerte si couleur déconseillée sélectionnée */}
          {selected && avoidedIds.has(selected) && sectorRules?.avoidReason && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive/70" />
              <div>
                <p className="text-[11px] font-medium text-destructive/90">
                  Déconseillé pour {sector}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {sectorRules.avoidReason}
                  {sectorRules.avoidAlternative && (
                    <> — Alternative recommandée :{" "}
                      <span className="font-medium text-foreground">
                        {CAUSSE_COLORS.find((c) => c.id === sectorRules.avoidAlternative)?.name}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Justification psychologique */}
          {selected && getColorById(selected) && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">
                💡 Psychologie de la couleur (J.-G. Causse)
              </p>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                {getColorById(selected)!.psycho}
              </p>

              {/* Note culturelle si une culture cible est définie */}
              {primaryCulture && CULTURE_COLOR_NOTES[selected]?.[primaryCulture] && (
                <div className="mt-2 rounded-md border border-blue-200/60 bg-blue-50/60 p-2 dark:border-blue-800/40 dark:bg-blue-950/30">
                  <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    {CULTURES.find((c) => c.id === primaryCulture)?.flag}{" "}
                    {CULTURES.find((c) => c.id === primaryCulture)?.label} — contexte culturel
                  </p>
                  <p className="mt-0.5 text-[11px] text-blue-700/80 leading-relaxed dark:text-blue-400/80">
                    {CULTURE_COLOR_NOTES[selected][primaryCulture]}
                  </p>
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-1">
                {getColorById(selected)!.sectors.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
