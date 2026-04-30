import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  trend?: string
  trendPositive?: boolean
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendPositive = true,
}: KpiCardProps) {
  return (
    <div className="glass-card group relative overflow-hidden rounded-2xl p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("rounded-lg p-2", iconBg, iconColor)}>
          <Icon className="size-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              trendPositive
                ? "bg-emerald-400/10 text-emerald-400"
                : "bg-red-400/10 text-red-400"
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-1 text-2xl font-bold text-foreground">{value}</h3>
    </div>
  )
}
