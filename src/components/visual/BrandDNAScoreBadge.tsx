'use client'

interface BrandDNAScoreBadgeProps {
  score: number
  className?: string
}

export function BrandDNAScoreBadge({ score, className = '' }: BrandDNAScoreBadgeProps) {
  const getColor = (s: number) => {
    if (s >= 85) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' }
    if (s >= 70) return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }
    if (s >= 55) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' }
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
  }

  const colors = getColor(score)

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      <span className="opacity-70">DNA</span>
      <span>{score}</span>
      <span className="opacity-50">/100</span>
    </div>
  )
}
