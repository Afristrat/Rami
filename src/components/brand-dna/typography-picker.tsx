"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Type } from "lucide-react"
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  type Typography,
  type TypographyLevel,
} from "@/lib/schemas/brand-dna.schema"

/* ─── Google Fonts URL builder ────────────────────── */

function googleFontsUrl(families: string[]): string {
  const unique = [...new Set(families)].filter(Boolean)
  if (unique.length === 0) return ""
  const params = unique
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;900`)
    .join("&")
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

function fontWeightValue(weight: string): number {
  const map: Record<string, number> = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  }
  return map[weight] ?? 400
}

/* ─── Single typography row ───────────────────────── */

interface TypographyRowProps {
  level: "heading" | "subheading" | "body"
  label: string
  value: TypographyLevel
  onChange: (value: TypographyLevel) => void
  sizeMin: number
  sizeMax: number
}

function TypographyRow({ level, label, value, onChange, sizeMin, sizeMax }: TypographyRowProps) {
  const t = useTranslations("brandDna")

  const selectClass = cn(
    "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
  )

  return (
    <div className="space-y-2">
      {/* Label */}
      <p className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{label}</p>

      {/* Controls row */}
      <div className="grid grid-cols-[1fr_70px_100px] gap-2 items-center">
        {/* Font family */}
        <select
          value={value.family}
          onChange={(e) => onChange({ ...value, family: e.target.value })}
          className={selectClass}
          aria-label={t("form.typographyFamily")}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Size */}
        <div className="relative">
          <input
            type="number"
            min={sizeMin}
            max={sizeMax}
            value={value.size}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10)
              if (!isNaN(num)) onChange({ ...value, size: Math.max(sizeMin, Math.min(sizeMax, num)) })
            }}
            className={cn(selectClass, "w-full pr-6 tabular-nums")}
            aria-label={t("form.typographySize")}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
            px
          </span>
        </div>

        {/* Weight */}
        <select
          value={value.weight}
          onChange={(e) => onChange({ ...value, weight: e.target.value })}
          className={selectClass}
          aria-label={t("form.typographyWeight")}
        >
          {FONT_WEIGHTS.map((w) => (
            <option key={w.id} value={w.id}>{t(`fontWeights.${w.id}`)}</option>
          ))}
        </select>
      </div>

      {/* Live preview */}
      <p
        className="rounded-md bg-muted/50 px-3 py-2 text-foreground truncate"
        style={{
          fontFamily: `"${value.family}", sans-serif`,
          fontSize: `${Math.min(value.size, level === "heading" ? 36 : level === "subheading" ? 28 : 20)}px`,
          fontWeight: fontWeightValue(value.weight),
          lineHeight: 1.3,
        }}
      >
        {t("form.typographyPreviewText")}
      </p>
    </div>
  )
}

/* ─── Typography Picker ───────────────────────────── */

interface TypographyPickerProps {
  value: Typography
  onChange: (value: Typography) => void
}

export function TypographyPicker({ value, onChange }: TypographyPickerProps) {
  const t = useTranslations("brandDna.form")

  const heading = value.heading ?? { family: "Inter", size: 32, weight: "bold" }
  const subheading = value.subheading ?? { family: "Inter", size: 20, weight: "semibold" }
  const body = value.body ?? { family: "Inter", size: 16, weight: "normal" }

  // Load Google Fonts
  const fontsUrl = googleFontsUrl([heading.family, subheading.family, body.family])

  return (
    <div className="space-y-3">
      {/* Google Fonts link */}
      {fontsUrl && (
        <link rel="stylesheet" href={fontsUrl} />
      )}

      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
          <Type className="size-3.5 text-primary" />
        </div>
        <p className="text-xs font-semibold text-foreground">{t("typographyLabel")}</p>
      </div>

      {/* Three rows */}
      <div className="space-y-4">
        <TypographyRow
          level="heading"
          label={t("typographyHeading")}
          value={heading}
          onChange={(v) => onChange({ ...value, heading: v })}
          sizeMin={16}
          sizeMax={96}
        />
        <TypographyRow
          level="subheading"
          label={t("typographySubheading")}
          value={subheading}
          onChange={(v) => onChange({ ...value, subheading: v })}
          sizeMin={12}
          sizeMax={72}
        />
        <TypographyRow
          level="body"
          label={t("typographyBody")}
          value={body}
          onChange={(v) => onChange({ ...value, body: v })}
          sizeMin={10}
          sizeMax={24}
        />
      </div>
    </div>
  )
}
