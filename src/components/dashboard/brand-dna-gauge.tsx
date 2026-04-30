"use client"

/**
 * Circular gauge for Brand DNA score (SVG).
 * Circumference for r=28: 2 * PI * 28 = ~175.93
 */
export function BrandDNAGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 28
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative size-16 shrink-0">
      <svg className="-rotate-90" viewBox="0 0 64 64" width={64} height={64}>
        <circle
          cx={32}
          cy={32}
          r={28}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={6}
          className="text-muted/30 dark:text-white/5"
        />
        <circle
          cx={32}
          cy={32}
          r={28}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-violet-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
        {score}%
      </span>
    </div>
  )
}
