"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { CAUSSE_COLORS, type CausseColor } from "@/lib/schemas/brand-dna.schema"

interface ColorSwatchProps {
  color: CausseColor
  selected: boolean
  disabled?: boolean
  onSelect: (id: string) => void
  showBadge?: "primary" | "secondary" | "accent"
}

function ColorSwatch({ color, selected, disabled, onSelect, showBadge }: ColorSwatchProps) {
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
      aria-label={`${color.name} — ${color.emotion}${selected ? " (sélectionnée)" : ""}${disabled ? " (déjà utilisée)" : ""}`}
      aria-pressed={selected}
      aria-disabled={disabled}
      className={cn(
        "group relative w-full rounded-xl border-2 p-3 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
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
  onChangePrimary: (id: string) => void
  onChangeSecondary: (id: string) => void
  onChangeAccent: (id: string) => void
  errors?: { primary?: string; secondary?: string; accent?: string }
}

export function ColorPalettePicker({
  primary,
  secondary,
  accent,
  onChangePrimary,
  onChangeSecondary,
  onChangeAccent,
  errors,
}: ColorPalettePickerProps) {
  const selectedIds = new Set([primary, secondary, accent].filter(Boolean))

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
                />
              )
            })}
          </div>

          {/* Justification psychologique */}
          {selected && getColorById(selected) && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">
                💡 Psychologie de la couleur (J.-G. Causse)
              </p>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                {getColorById(selected)!.psycho}
              </p>
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
