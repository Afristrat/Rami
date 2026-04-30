"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Wand2,
  CheckCircle,
  Grid2X2,
  GalleryHorizontalEnd,
} from "lucide-react"
import {
  MOCK_THEMES,
  PALETTE_COLORS,
} from "./presentation-types"

interface StepStyleProps {
  selectedTheme: string
  onSelectTheme: (themeId: string) => void
  onNext: () => void
  onBack: () => void
}

export function StepStyle({
  selectedTheme,
  onSelectTheme,
  onNext,
  onBack,
}: StepStyleProps) {
  const t = useTranslations("presentations")
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid")
  const activeTheme =
    MOCK_THEMES.find((t) => t.id === selectedTheme) ?? MOCK_THEMES[0]

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-grow flex flex-col max-w-5xl mx-auto w-full px-6 py-8 gap-8">
        {/* Progress */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-primary">
              {t("stepStyle")}
            </span>
            <span className="text-muted-foreground">{t("styleCompleted")}</span>
          </div>
          <div className="w-full bg-muted dark:bg-muted/50 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: "75%" }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="h-1 rounded-full bg-primary" />
            <div className="h-1 rounded-full bg-primary" />
            <div className="h-1 rounded-full bg-primary" />
            <div className="h-1 rounded-full bg-muted dark:bg-muted/50" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Settings */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Active Style Card */}
            <div className="bg-primary/5 border border-primary/30 rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 p-2 rounded-full">
                  <CheckCircle className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("brandDnaStyle")}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("brandDnaStyleDesc")}
              </p>
              <button className="w-full py-2.5 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-primary text-sm font-semibold transition-all">
                {t("customizeStyle")}
              </button>
            </div>

            {/* Color Swatches */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {t("activePalette")}
              </h4>
              <div
                className={cn(
                  "flex gap-4 p-4 rounded-xl",
                  "bg-muted/40 dark:bg-muted/20 border border-border"
                )}
              >
                {PALETTE_COLORS.map((color) => (
                  <div
                    key={color.hex}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="size-12 rounded-full border-2 border-white/20 shadow-lg"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {color.hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {t("typography")}
              </h4>
              <div
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-xl",
                  "bg-muted/40 dark:bg-muted/20 border border-border"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">{t("titles")}</span>
                  <span className="text-foreground text-sm font-bold">
                    Plus Jakarta Sans
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">{t("body")}</span>
                  <span className="text-foreground text-sm">Inter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Previews */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {t("themesPreview")}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "grid"
                      ? "bg-muted text-foreground"
                      : "bg-muted/40 text-muted-foreground"
                  )}
                >
                  <Grid2X2 className="size-5" />
                </button>
                <button
                  onClick={() => setViewMode("carousel")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "carousel"
                      ? "bg-muted text-foreground"
                      : "bg-muted/40 text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <GalleryHorizontalEnd className="size-5" />
                </button>
              </div>
            </div>

            {/* Theme Thumbnails */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_THEMES.map((theme) => {
                const isActive = theme.id === selectedTheme
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme.id)}
                    className={cn(
                      "group relative flex flex-col gap-3 text-left transition-transform",
                      !isActive && "hover:scale-105"
                    )}
                  >
                    <div
                      className={cn(
                        "aspect-video rounded-xl overflow-hidden transition-all",
                        "bg-muted dark:bg-background",
                        isActive
                          ? "border-2 border-primary shadow-2xl shadow-primary/10"
                          : "border border-border opacity-60 group-hover:opacity-100"
                      )}
                    >
                      <div
                        className="w-full h-full flex flex-col p-4 relative"
                        style={{
                          background: `linear-gradient(135deg, ${theme.accentColor}30, transparent)`,
                        }}
                      >
                        <div
                          className="size-3 rounded-full mb-2"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                        <div className="h-2 w-1/2 bg-foreground/20 rounded-full mb-1" />
                        <div className="h-4 w-3/4 bg-foreground/80 rounded-full mb-4" />
                        <div className="flex gap-1 mt-auto">
                          <div
                            className="h-1.5 w-6 rounded-full"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                          <div className="h-1.5 w-1.5 bg-muted-foreground/30 rounded-full" />
                          <div className="h-1.5 w-1.5 bg-muted-foreground/30 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-center text-xs font-medium",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {theme.name}
                      {isActive && ` ${t("activeTheme")}`}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Main Preview */}
            <div className="mt-4 relative rounded-2xl bg-muted/50 dark:bg-muted/20 border border-border p-1">
              <div
                className={cn(
                  "rounded-xl aspect-video relative overflow-hidden shadow-inner flex items-center justify-center",
                  "bg-background border border-white/5 dark:border-white/5"
                )}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${activeTheme.accentColor}15, transparent, ${activeTheme.accentColor}08)`,
                  }}
                />
                {/* Slide preview content */}
                <div className="relative z-10 w-4/5 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-1 w-12 rounded-full"
                      style={{ backgroundColor: activeTheme.accentColor }}
                    />
                    <span
                      className="font-bold tracking-widest text-xs uppercase"
                      style={{ color: activeTheme.accentColor }}
                    >
                      Rapport de Synth{"\u00E8"}se
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                    Analyse du{" "}
                    <span style={{ color: activeTheme.accentColor }}>
                      Style Visuel
                    </span>{" "}
                    pour RAMI
                  </h2>
                  <p className="text-muted-foreground text-base lg:text-lg max-w-xl">
                    Cette diapositive utilise les polices Inter et Plus Jakarta
                    Sans combin{"\u00E9"}es {"\u00E0"} une palette de violets profonds.
                  </p>
                  <div className="flex gap-4">
                    <div
                      className="px-6 py-2 rounded-full text-sm font-semibold border"
                      style={{
                        backgroundColor: `${activeTheme.accentColor}20`,
                        borderColor: `${activeTheme.accentColor}40`,
                        color: activeTheme.accentColor,
                      }}
                    >
                      Vision Strat{"\u00E9"}gique
                    </div>
                    <div className="px-6 py-2 bg-muted border border-border rounded-full text-muted-foreground text-sm font-semibold">
                      Innovation UI
                    </div>
                  </div>
                </div>
                {/* Background decoration */}
                <div
                  className="absolute -right-16 -bottom-16 size-64 rounded-full blur-[100px]"
                  style={{ backgroundColor: `${activeTheme.accentColor}30` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className={cn(
          "mt-auto border-t px-6 py-5",
          "border-border",
          "bg-background/80 backdrop-blur-lg"
        )}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-semibold"
          >
            <ArrowLeft className="size-5" />
            <span>{t("back")}</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            className={cn(
              "px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all transform",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "hover:scale-[1.02] active:scale-[0.98]",
              "shadow-lg shadow-primary/20"
            )}
          >
            <span>{t("generatePresentation")}</span>
            <Wand2 className="size-5" />
          </button>
        </div>
      </footer>
    </div>
  )
}
