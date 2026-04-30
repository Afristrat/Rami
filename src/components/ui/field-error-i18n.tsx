"use client"

import { useTranslations } from "next-intl"

interface TranslatedFieldErrorProps {
  message?: string
  className?: string
}

/**
 * Displays a Zod validation error message, resolving i18n keys automatically.
 *
 * If the message starts with "validation.", it is treated as a translation key
 * and resolved via useTranslations(). Otherwise it is displayed as-is.
 */
export function TranslatedFieldError({ message, className }: TranslatedFieldErrorProps) {
  const t = useTranslations()

  if (!message) return null

  const isKey = message.startsWith("validation.")
  const displayMessage = isKey ? t(message) : message

  return (
    <p className={className ?? "text-xs text-destructive mt-1"}>
      {displayMessage}
    </p>
  )
}
