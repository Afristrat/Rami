"use client"

/**
 * AiAssistButton — Feature 5
 *
 * Petit bouton carré inline à droite du champ.
 * - Valeur vide ou < 30 chars → icône Sparkles (générer)
 * - Valeur ≥ 30 chars → icône Wand2 (améliorer)
 * Mutuellement exclusif : un seul bouton visible à la fois.
 */

import React, { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Sparkles, Wand2, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface AiAssistContext {
  brandName?: string
  sector?: string
  objectifCognitif?: string
}

interface AiAssistButtonProps {
  value: string
  field: "positioning" | "tagline" | "audienceDescription" | "audiencePainPoints"
  context: AiAssistContext
  onApply: (text: string) => void
  className?: string
}

type ButtonState = "idle" | "loading" | "suggested" | "error"

const ANNULER_DURATION_S = 10
const IMPROVE_THRESHOLD = 30

/* ─── Composant ──────────────────────────────────────────────────────────── */

export function AiAssistButton({
  value,
  field,
  context,
  onApply,
  className,
}: AiAssistButtonProps) {
  const t = useTranslations("brandDna.aiAssist")
  const [state, setState] = useState<ButtonState>("idle")
  const [suggestion, setSuggestion] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [countdown, setCountdown] = useState(ANNULER_DURATION_S)

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoApplyRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionRef = useRef(suggestion)

  useEffect(() => {
    suggestionRef.current = suggestion
  }, [suggestion])

  const clearTimers = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (autoApplyRef.current) clearTimeout(autoApplyRef.current)
  }

  useEffect(() => () => clearTimers(), [])

  const isGenerate = value.length < IMPROVE_THRESHOLD

  const handleClick = async () => {
    if (state !== "idle") return
    setState("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/brand-dna/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isGenerate ? "generate" : "improve",
          field,
          currentValue: isGenerate ? undefined : value,
          context,
        }),
      })

      const data = (await res.json()) as { result?: string; error?: string }

      if (!res.ok || !data.result) {
        setErrorMsg(data.error ?? t("aiError"))
        setState("error")
        setTimeout(() => setState("idle"), 4000)
        return
      }

      if (isGenerate) {
        onApply(data.result)
        setState("idle")
      } else {
        setSuggestion(data.result)
        setCountdown(ANNULER_DURATION_S)
        setState("suggested")

        countdownRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearTimers()
              return 0
            }
            return c - 1
          })
        }, 1000)

        autoApplyRef.current = setTimeout(() => {
          onApply(suggestionRef.current)
          setState("idle")
          setSuggestion("")
        }, ANNULER_DURATION_S * 1000)
      }
    } catch {
      setErrorMsg(t("connectionError"))
      setState("error")
      setTimeout(() => setState("idle"), 4000)
    }
  }

  const handleApply = () => {
    clearTimers()
    onApply(suggestion)
    setState("idle")
    setSuggestion("")
  }

  const handleCancel = () => {
    clearTimers()
    setState("idle")
    setSuggestion("")
  }

  /* ── Panneau suggestion (mode amélioration) ──── */
  if (state === "suggested") {
    return (
      <div
        className={cn(
          "mt-2 rounded-lg border border-violet-200/60 bg-violet-50/50 p-2.5",
          "dark:border-violet-800/40 dark:bg-violet-950/20",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="size-3 shrink-0 text-violet-500" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
            Suggestion IA
          </span>
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {countdown}s
          </span>
        </div>

        <p className="mb-2 text-xs italic leading-relaxed text-foreground/90">
          &ldquo;{suggestion}&rdquo;
        </p>

        <div className="flex items-center gap-1.5">
          <Button type="button" size="sm" onClick={handleApply} className="h-6 gap-1 bg-violet-600 px-2 text-[10px] hover:bg-violet-700">
            <Check className="size-2.5" />
            Appliquer
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleCancel} className="h-6 gap-1 px-2 text-[10px]">
            <X className="size-2.5" />
            Annuler
          </Button>
        </div>
      </div>
    )
  }

  /* ── Erreur ──── */
  if (state === "error") {
    return (
      <p className={cn("mt-1 flex items-center gap-1 text-[10px] text-destructive", className)} role="alert">
        <X className="size-3 shrink-0" />
        {errorMsg}
      </p>
    )
  }

  /* ── Bouton carré idle / loading ──── */
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      title={isGenerate ? t("generateWithAi") : t("improveWithAi")}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-all",
        state === "loading"
          ? "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30"
          : isGenerate
            ? "border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:border-violet-300 dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-400 dark:hover:bg-violet-950/40"
            : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {state === "loading" ? (
        <Loader2 className="size-3.5 animate-spin text-violet-500" />
      ) : isGenerate ? (
        <Sparkles className="size-3.5" />
      ) : (
        <Wand2 className="size-3.5" />
      )}
    </button>
  )
}
