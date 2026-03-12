"use client"

/**
 * AiAssistButton — Feature 5
 *
 * Bouton IA mutuellement exclusif sur les champs Tagline et Positionnement.
 * - Valeur < 50 chars → "Générer avec IA" (génération directe)
 * - Valeur ≥ 50 chars → "Améliorer avec IA" (proposition + Annuler 10s)
 */

import React, { useState, useEffect, useRef } from "react"
import { Sparkles, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface AiAssistContext {
  brandName?: string
  sector?: string
  objectifCognitif?: string
}

interface AiAssistButtonProps {
  /** Valeur actuelle du champ — détermine generate vs improve */
  value: string
  /** Champ cible */
  field: "positioning" | "tagline"
  /** Contexte Brand DNA pour construire le prompt */
  context: AiAssistContext
  /** Appelé avec le texte à insérer dans le champ */
  onApply: (text: string) => void
  className?: string
}

type ButtonState = "idle" | "loading" | "suggested" | "error"

const ANNULER_DURATION_S = 10

/* ─── Composant ──────────────────────────────────────────────────────────── */

export function AiAssistButton({
  value,
  field,
  context,
  onApply,
  className,
}: AiAssistButtonProps) {
  const [state, setState] = useState<ButtonState>("idle")
  const [suggestion, setSuggestion] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [countdown, setCountdown] = useState(ANNULER_DURATION_S)

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoApplyRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionRef = useRef(suggestion)

  // Garde la ref à jour pour éviter les stale closures dans les timers
  useEffect(() => {
    suggestionRef.current = suggestion
  }, [suggestion])

  const clearTimers = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (autoApplyRef.current) clearTimeout(autoApplyRef.current)
  }

  // Cleanup à l'unmount
  useEffect(() => () => clearTimers(), [])

  const isGenerate = value.length < 50

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
        setErrorMsg(data.error ?? "Erreur IA. Réessayez.")
        setState("error")
        setTimeout(() => setState("idle"), 4000)
        return
      }

      if (isGenerate) {
        // Génération directe → application immédiate
        onApply(data.result)
        setState("idle")
      } else {
        // Amélioration → panneau de suggestion + countdown
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
      setErrorMsg("Impossible de contacter l'IA. Vérifiez votre connexion.")
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
          "mt-2 rounded-xl border border-violet-200/60 bg-violet-50/50 p-3",
          "dark:border-violet-800/40 dark:bg-violet-950/20",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="size-3.5 shrink-0 text-violet-500" aria-hidden="true" />
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
            Suggestion IA
          </span>
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            Application dans {countdown}s…
          </span>
        </div>

        <p className="mb-3 text-sm italic leading-relaxed text-foreground/90">
          &ldquo;{suggestion}&rdquo;
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="h-7 gap-1 bg-violet-600 px-2.5 text-xs hover:bg-violet-700"
          >
            <Check className="size-3" />
            Appliquer
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-7 gap-1 px-2.5 text-xs"
          >
            <X className="size-3" />
            Annuler ({countdown}s)
          </Button>
        </div>
      </div>
    )
  }

  /* ── Erreur ──── */
  if (state === "error") {
    return (
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 text-xs text-destructive",
          className
        )}
        role="alert"
      >
        <X className="size-3 shrink-0" />
        {errorMsg}
      </p>
    )
  }

  /* ── Bouton idle / loading ──── */
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={handleClick}
      disabled={state === "loading"}
      aria-label={state === "loading" ? "Génération en cours…" : isGenerate ? "Générer avec IA" : "Améliorer avec IA"}
      className={cn(
        "h-7 gap-1.5 px-2.5 text-xs",
        "text-violet-600 hover:bg-violet-50 hover:text-violet-700",
        "dark:text-violet-400 dark:hover:bg-violet-950/40 dark:hover:text-violet-300",
        className
      )}
    >
      {state === "loading" ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles className="size-3" aria-hidden="true" />
      )}
      {state === "loading" ? "Génération…" : isGenerate ? "Générer avec IA" : "Améliorer avec IA"}
    </Button>
  )
}
