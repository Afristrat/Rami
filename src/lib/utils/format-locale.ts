import { useLocale } from "next-intl"

const LOCALE_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-SA",
  es: "es-ES",
  pt: "pt-BR",
  de: "de-DE",
  tr: "tr-TR",
  zh: "zh-CN",
}

/** Client component hook — returns the Intl locale string */
export function useIntlLocale(): string {
  const locale = useLocale()
  return LOCALE_MAP[locale] ?? "fr-FR"
}

/** For non-hook contexts — pass the locale string directly */
export function getIntlLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? "fr-FR"
}
