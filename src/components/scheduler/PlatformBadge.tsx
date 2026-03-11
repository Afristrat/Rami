import { cn } from "@/lib/utils"
import { PLATFORM_CONFIG, type Platform } from "@/lib/scheduler/platform-config"

interface PlatformBadgeProps {
  platform: Platform
  size?: "xs" | "sm" | "md"
  className?: string
}

export function PlatformBadge({ platform, size = "sm", className }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform]
  if (!config) return null

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        config.bgClass,
        config.textClass,
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        className
      )}
    >
      {config.label}
    </span>
  )
}

interface PlatformDotProps {
  platform: Platform
  className?: string
}

export function PlatformDot({ platform, className }: PlatformDotProps) {
  const config = PLATFORM_CONFIG[platform]
  if (!config) return null

  return (
    <span
      title={config.label}
      className={cn("inline-block size-2 rounded-full shrink-0", className)}
      style={{ backgroundColor: config.color }}
    />
  )
}
