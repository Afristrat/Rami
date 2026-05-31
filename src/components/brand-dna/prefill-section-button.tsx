"use client"

/**
 * PrefillSectionButton — Feature 6
 *
 * Bouton t("prefillWithAi") en haut de chaque section Brand DNA.
 * - Appelle /api/brand-dna/ai-assist?action=prefill-section
 * - Remplit les champs progressivement (400ms entre chaque champ)
 * - Affiche un bouton "Annuler (Xs)" pendant 15 secondes pour revenir en arrière
 */

import React, { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Wand2, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { UseFormSetValue, UseFormGetValues } from "react-hook-form"
import type { BrandDnaFormData } from "@/lib/schemas/brand-dna.schema"

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type PrefillSection = "identite" | "audience" | "style"

export interface PrefillContext {
  brandName?: string
  sector?: string
  objectifCognitif?: string
  voiceTone?: string
  primaryCulture?: string
  tagline?: string
  positioning?: string
}

interface PrefillSectionButtonProps {
  section: PrefillSection
  context: PrefillContext
  setValue: UseFormSetValue<BrandDnaFormData>
  getValues: UseFormGetValues<BrandDnaFormData>
  className?: string
}

type PrefillState = "idle" | "loading" | "filling"

const ANNULER_DURATION_S = 15
const FILL_DELAY_MS = 400

/** Champs affectés par section (ordre = séquence d'animation) */
const SECTION_FIELDS: Record<PrefillSection, (keyof BrandDnaFormData)[]> = {
  identite: ["tagline", "positioning"],
  audience: ["audienceDescription", "audienceAge", "audienceLocation", "audiencePainPoints"],
  style: ["voiceTone"],
}

/* ─── Composant ──────────────────────────────────────────────────────────── */

export function PrefillSectionButton({
  section,
  context,
  setValue,
  getValues,
  className,
}: PrefillSectionButtonProps) {
  const t = useTranslations("brandDna.prefill")
  const [state, setState] = useState<PrefillState>("idle")
  const [countdown, setCountdown] = useState(ANNULER_DURATION_S)
  const [errorMsg, setErrorMsg] = useState("")

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoEndRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapshotRef = useRef<Partial<BrandDnaFormData> | null>(null)
  const cancelledRef = useRef(false)

  const clearTimers = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (autoEndRef.current) clearTimeout(autoEndRef.current)
  }

  useEffect(() => () => clearTimers(), [])

  const startUndoTimer = () => {
    setCountdown(ANNULER_DURATION_S)

    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearTimers()
          setState("idle")
          return 0
        }
        return c - 1
      })
    }, 1000)

    autoEndRef.current = setTimeout(() => {
      setState("idle")
    }, ANNULER_DURATION_S * 1000)
  }

  const handlePrefill = async () => {
    if (state !== "idle") return
    setState("loading")
    setErrorMsg("")
    cancelledRef.current = false

    // Capture snapshot pour undo
    const fields = SECTION_FIELDS[section]
    const snapshot: Partial<BrandDnaFormData> = {}
    for (const f of fields) {
      snapshot[f] = (getValues(f) ?? "") as never
    }
    snapshotRef.current = snapshot

    try {
      const res = await fetch("/api/brand-dna/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prefill-section",
          section,
          context,
        }),
      })

      const data = (await res.json()) as {
        fields?: Record<string, string>
        error?: string
      }

      if (!res.ok || !data.fields) {
        setErrorMsg(data.error ?? t("aiError"))
        setState("idle")
        return
      }

      // Démarrer le countdown et passer en mode "filling"
      setState("filling")
      startUndoTimer()

      // Animation progressive des champs
      const entries = Object.entries(data.fields)
      for (let i = 0; i < entries.length; i++) {
        if (cancelledRef.current) break

        if (i > 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, FILL_DELAY_MS))
        }

        if (cancelledRef.current) break

        const [key, val] = entries[i]
        if (fields.includes(key as keyof BrandDnaFormData)) {
          setValue(key as keyof BrandDnaFormData, val, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      }
    } catch {
      setErrorMsg(t("connectionError"))
      setState("idle")
    }
  }

  const handleUndo = () => {
    cancelledRef.current = true
    clearTimers()

    const snapshot = snapshotRef.current
    if (snapshot) {
      const fields = SECTION_FIELDS[section]
      for (const f of fields) {
        setValue(f, (snapshot[f] ?? "") as never, { shouldDirty: true })
      }
    }

    setState("idle")
    snapshotRef.current = null
  }

  /* ── Mode countdown après remplissage ──── */
  if (state === "filling") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wand2 className="size-3 text-violet-500" aria-hidden="true" />
          Pré-rempli par IA
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="size-3" aria-hidden="true" />
          Annuler ({countdown}s)
        </Button>
      </div>
    )
  }

  /* ── Bouton idle / loading ──── */
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handlePrefill}
        disabled={state === "loading"}
        className={cn(
          "h-7 gap-1.5 px-3 text-xs",
          "border-violet-200 text-violet-600 hover:border-violet-300 hover:bg-violet-50",
          "dark:border-violet-800/50 dark:text-violet-400 dark:hover:bg-violet-950/30"
        )}
      >
        {state === "loading" ? (
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        ) : (
          <Wand2 className="size-3" aria-hidden="true" />
        )}
        {state === "loading" ? t("generating") : "Pré-remplir avec IA"}
      </Button>

      {errorMsg && (
        <p className="text-xs text-destructive" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
