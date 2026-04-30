"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle, Check, ChevronDown, Star, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useExpertMode } from "@/lib/hooks/use-expert-mode"
import {
  CAUSSE_COLORS,
  SECTOR_COLOR_RULES,
  CULTURE_COLOR_NOTES,
  CULTURES,
  type CausseColor,
} from "@/lib/schemas/brand-dna.schema"

/* ─── Color Swatch ─── */

interface ColorSwatchProps {
  color: CausseColor
  selected: boolean
  disabled?: boolean
  onSelect: (id: string) => void
  isRecommended?: boolean
  isAvoided?: boolean
  compact?: boolean
}

function ColorSwatch({
  color,
  selected,
  disabled,
  onSelect,
  isRecommended,
  isAvoided,
  compact,
}: ColorSwatchProps) {
  const tColors = useTranslations("brandDna.colors")

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(color.id)}
      aria-pressed={selected}
      aria-disabled={disabled}
      title={tColors(`${color.id}.psycho`)}
      className={cn(
        "group relative rounded-lg border-2 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "p-2" : "p-3",
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
    >
      {/* Badges */}
      {isRecommended && !selected && !disabled && (
        <span className="absolute -left-1 -top-1 z-10 flex items-center gap-0.5 rounded-full bg-green-500 px-1 py-0.5 text-[8px] font-bold text-white shadow-sm">
          <Star className="size-2" />
        </span>
      )}
      {isAvoided && !selected && !disabled && (
        <span className="absolute -left-1 -top-1 z-10 flex items-center gap-0.5 rounded-full bg-destructive/80 px-1 py-0.5 text-[8px] font-bold text-white shadow-sm">
          <AlertTriangle className="size-2" />
        </span>
      )}

      <div className="flex items-center gap-2">
        <div
          className={cn("relative shrink-0 rounded-md shadow-sm", compact ? "size-7" : "size-9")}
          style={{ backgroundColor: color.hex }}
        >
          {selected && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/20">
              <Check className="size-3.5 text-white drop-shadow" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold text-foreground leading-tight", compact ? "text-[11px]" : "text-xs")}>{tColors(`${color.id}.name`)}</p>
          <p className={cn("text-muted-foreground leading-tight", compact ? "text-[9px]" : "text-[11px]")}>{tColors(`${color.id}.emotion`)}</p>
        </div>
      </div>
    </button>
  )
}

/* ─── Selected Color Pills ─── */

function SelectedPills({
  ids,
  onRemove,
}: {
  ids: string[]
  onRemove: (id: string) => void
}) {
  const tColors = useTranslations("brandDna.colors")

  if (ids.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const color = CAUSSE_COLORS.find((c) => c.id === id)
        if (!color) return null
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 pl-1 pr-2 py-0.5"
          >
            <span className="size-4 rounded-full shadow-sm" style={{ backgroundColor: color.hex }} />
            <span className="text-[11px] font-medium text-foreground">{tColors(`${color.id}.name`)}</span>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="ml-0.5 flex size-4 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="size-2.5" />
            </button>
          </span>
        )
      })}
    </div>
  )
}

/* ─── Accordion Section ─── */

interface AccordionColorSectionProps {
  label: string
  description: string
  selectedIds: string[]
  allUsedIds: Set<string>
  onChange: (ids: string[]) => void
  isOpen: boolean
  onToggle: () => void
  onAutoAdvance: () => void
  sector?: string
  primaryCulture?: string
  error?: string
  sectorRules?: { recommended?: string[]; avoid?: string[]; avoidReasonKey?: string; avoidAlternative?: string }
}

function AccordionColorSection({
  label,
  description,
  selectedIds,
  allUsedIds,
  onChange,
  isOpen,
  onToggle,
  onAutoAdvance,
  sector,
  primaryCulture,
  error,
  sectorRules,
}: AccordionColorSectionProps) {
  const t = useTranslations("brandDna.colorPicker")
  const tColors = useTranslations("brandDna.colors")
  const tCultureNotes = useTranslations("brandDna.cultureColorNotes")
  const tCultures = useTranslations("brandDna.cultures")
  const recommendedIds = new Set(sectorRules?.recommended ?? [])
  const avoidedIds = new Set(sectorRules?.avoid ?? [])

  const handleSelect = useCallback((id: string) => {
    const isAlreadySelected = selectedIds.includes(id)
    let next: string[]
    if (isAlreadySelected) {
      next = selectedIds.filter((s) => s !== id)
    } else {
      next = [...selectedIds, id]
    }
    onChange(next)

    // Auto-advance si on vient d'ajouter (pas retirer)
    if (!isAlreadySelected) {
      setTimeout(() => onAutoAdvance(), 300)
    }
  }, [selectedIds, onChange, onAutoAdvance])

  const previewColors = selectedIds
    .map((id) => CAUSSE_COLORS.find((c) => c.id === id))
    .filter(Boolean) as CausseColor[]

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isOpen ? "border-primary/30 bg-primary/[0.02]" : "border-border"
    )}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        {/* Preview swatches */}
        <div className="flex -space-x-1.5">
          {previewColors.length > 0 ? (
            previewColors.map((c) => (
              <span
                key={c.id}
                className="size-6 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
            ))
          ) : (
            <span className="size-6 rounded-full border-2 border-dashed border-muted-foreground/30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{description}</p>
        </div>
        {selectedIds.length > 0 && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {error && (
        <p className="px-3 pb-2 text-xs text-destructive">{error}</p>
      )}

      {/* Content — collapsible */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {/* Selected pills */}
          <SelectedPills
            ids={selectedIds}
            onRemove={(id) => onChange(selectedIds.filter((s) => s !== id))}
          />

          {/* Legend */}
          {sectorRules && (recommendedIds.size > 0 || avoidedIds.size > 0) && (
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              {recommendedIds.size > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-3 text-green-500" /> {t("recommendedFor", { sector: sector ?? "" })}
                </span>
              )}
              {avoidedIds.size > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="size-3 text-destructive/70" /> {t("avoid")}
                </span>
              )}
            </div>
          )}

          {/* Color grid — full width */}
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
            {CAUSSE_COLORS.map((color) => {
              const isSelected = selectedIds.includes(color.id)
              const isUsedElsewhere = allUsedIds.has(color.id) && !isSelected
              return (
                <ColorSwatch
                  key={color.id}
                  color={color}
                  selected={isSelected}
                  disabled={isUsedElsewhere}
                  onSelect={handleSelect}
                  isRecommended={recommendedIds.has(color.id) && !isUsedElsewhere}
                  isAvoided={avoidedIds.has(color.id) && !isUsedElsewhere && !isSelected}
                  compact
                />
              )
            })}
          </div>

          {/* Psycho details for first selected */}
          {selectedIds.length > 0 && (() => {
            const firstColor = CAUSSE_COLORS.find((c) => c.id === selectedIds[0])
            if (!firstColor) return null
            const cultureFlag = primaryCulture ? CULTURES.find((c) => c.id === primaryCulture)?.flag : undefined
            const hasCultureNote = primaryCulture && CULTURE_COLOR_NOTES[selectedIds[0]]?.[primaryCulture]
            return (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                <p className="text-[11px] font-medium text-primary">
                  {tColors(`${firstColor.id}.name`)} — {tColors(`${firstColor.id}.emotion`)}
                </p>
                <p className="mt-0.5 text-[11px] text-foreground/80 leading-relaxed">
                  {tColors(`${firstColor.id}.psycho`)}
                </p>
                {hasCultureNote && (
                  <p className="mt-1 text-[10px] text-blue-600 dark:text-blue-400">
                    {cultureFlag}{" "}
                    {tCultureNotes(`${selectedIds[0]}.${primaryCulture}`)}
                  </p>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ─── */

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
  const { isExpert } = useExpertMode()
  const t = useTranslations("brandDna.colorPicker")
  const tColors = useTranslations("brandDna.colors")
  const tCultureNotes = useTranslations("brandDna.cultureColorNotes")
  const tCultures = useTranslations("brandDna.cultures")
  const tSectorRules = useTranslations("brandDna.sectorColorRules")
  const [openSection, setOpenSection] = useState(0)

  const sectorRules = sector ? SECTOR_COLOR_RULES[sector] : undefined

  // Convert single values to arrays for the accordion multi-select
  const primaryIds = primary ? [primary] : []
  const secondaryIds = secondary ? [secondary] : []
  const accentIds = accent ? [accent] : []
  const allUsedIds = new Set([...primaryIds, ...secondaryIds, ...accentIds])

  const sections = [
    {
      label: t("primaryColor"),
      description: t("primaryColorDescShort"),
      selectedIds: primaryIds,
      onChange: (ids: string[]) => onChangePrimary(ids[ids.length - 1] ?? ""),
      error: errors?.primary,
    },
    {
      label: t("secondaryColor"),
      description: t("secondaryColorDescShort"),
      selectedIds: secondaryIds,
      onChange: (ids: string[]) => onChangeSecondary(ids[ids.length - 1] ?? ""),
      error: errors?.secondary,
    },
    {
      label: t("accentColor"),
      description: t("accentColorDescShort"),
      selectedIds: accentIds,
      onChange: (ids: string[]) => onChangeAccent(ids[ids.length - 1] ?? ""),
      error: errors?.accent,
    },
  ]

  /* ── Mode Expert : Accordéon avec auto-avance ── */
  if (isExpert) {
    return (
      <div className="space-y-2 w-full">
        {sections.map((section, idx) => (
          <AccordionColorSection
            key={idx}
            label={section.label}
            description={section.description}
            selectedIds={section.selectedIds}
            allUsedIds={allUsedIds}
            onChange={section.onChange}
            isOpen={openSection === idx}
            onToggle={() => setOpenSection(openSection === idx ? -1 : idx)}
            onAutoAdvance={() => {
              if (idx < sections.length - 1) {
                setOpenSection(idx + 1)
              } else {
                setOpenSection(-1) // ferme tout si c'est le dernier
              }
            }}
            sector={sector}
            primaryCulture={primaryCulture}
            error={section.error}
            sectorRules={sectorRules}
          />
        ))}
      </div>
    )
  }

  /* ── Mode Guidé : layout classique (3 sections empilées) ── */
  const selectedIds = new Set([primary, secondary, accent].filter(Boolean))
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
        <div className="rounded-xl border border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.03] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("palettePreview")}
          </p>
          <div className="flex gap-3">
            {[
              { color: primaryColor, role: t("rolePrimary") },
              { color: secondaryColor, role: t("roleSecondary") },
              { color: accentColor, role: t("roleAccent") },
            ].map(({ color, role }) =>
              color ? (
                <div key={role} className="flex-1 space-y-1.5">
                  <div className="h-12 rounded-lg shadow-sm" style={{ backgroundColor: color.hex }} />
                  <p className="text-center text-[10px] font-medium text-muted-foreground">{role}</p>
                  <p className="text-center text-[10px] text-muted-foreground/70 truncate px-1">{tColors(`${color.id}.name`)}</p>
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

      {/* Sélecteur classique */}
      {[
        {
          label: t("primaryColor"),
          description: t("primaryColorDesc"),
          selected: primary,
          onChange: onChangePrimary,
          role: "primary" as const,
          error: errors?.primary,
        },
        {
          label: t("secondaryColor"),
          description: t("secondaryColorDesc"),
          selected: secondary,
          onChange: onChangeSecondary,
          role: "secondary" as const,
          error: errors?.secondary,
        },
        {
          label: t("accentColor"),
          description: t("accentColorDesc"),
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
          {sectorRules && (recommendedIds.size > 0 || avoidedIds.size > 0) && (
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              {recommendedIds.size > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-3 text-green-500" /> {t("recommendedFor", { sector: sector ?? "" })}
                </span>
              )}
              {avoidedIds.size > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="size-3 text-destructive/70" /> {t("avoid")}
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
                  isRecommended={recommendedIds.has(color.id) && !isUsedElsewhere}
                  isAvoided={avoidedIds.has(color.id) && !isUsedElsewhere && !isSelected}
                />
              )
            })}
          </div>

          {selected && avoidedIds.has(selected) && sectorRules?.avoidReasonKey && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive/70" />
              <div>
                <p className="text-[11px] font-medium text-destructive/90">{t("notRecommendedFor", { sector: sector ?? "" })}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {tSectorRules(sectorRules.avoidReasonKey)}
                  {sectorRules.avoidAlternative && (
                    <> — {t("alternative")} <span className="font-medium text-foreground">{tColors(`${sectorRules.avoidAlternative}.name`)}</span></>
                  )}
                </p>
              </div>
            </div>
          )}

          {selected && getColorById(selected) && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">{t("psychologyTitle")}</p>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">{tColors(`${selected}.psycho`)}</p>
              {primaryCulture && CULTURE_COLOR_NOTES[selected]?.[primaryCulture] && (
                <div className="mt-2 rounded-md border border-blue-200/60 bg-blue-50/60 p-2 dark:border-blue-800/40 dark:bg-blue-950/30">
                  <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    {CULTURES.find((c) => c.id === primaryCulture)?.flag} {tCultures(primaryCulture)} — {t("culturalContext")}
                  </p>
                  <p className="mt-0.5 text-[11px] text-blue-700/80 leading-relaxed dark:text-blue-400/80">
                    {tCultureNotes(`${selected}.${primaryCulture}`)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
