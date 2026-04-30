'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FileText, Download, Share2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface TranscriptionExportBarProps {
  transcriptText: string | null
  title: string
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TranscriptionExportBar({ transcriptText, title }: TranscriptionExportBarProps) {
  const t = useTranslations("transcriptions")
  const tCommon = useTranslations("common")
  const [copied, setCopied] = useState(false)

  const text = transcriptText ?? ''

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback silencieux
    }
  }

  const handleExportTxt = () => {
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'transcription'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    // Utilise l'API print du navigateur en l'absence d'un g\u00e9n\u00e9rateur PDF
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transcription : ${title}`,
          text: text.slice(0, 500),
        })
      } catch {
        // Annulation utilisateur
      }
    }
  }

  const actions = [
    {
      icon: copied ? Check : Copy,
      label: copied ? tCommon('copied') : t('copyText'),
      onClick: handleCopy,
      highlight: copied,
    },
    { icon: Download, label: t('exportPdf'), onClick: handleExportPdf, highlight: false },
    { icon: FileText, label: t('exportTxt'), onClick: handleExportTxt, highlight: false },
    { icon: Share2, label: t('share'), onClick: handleShare, highlight: false },
  ]

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 px-4 py-3 print:hidden',
        'glass-card border-t rounded-none',
        'md:left-[var(--sidebar-width,256px)]'
      )}
    >
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium transition-colors',
              action.highlight
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'border border-border bg-background text-foreground hover:bg-muted/50'
            )}
          >
            <action.icon className="size-3.5" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
