"use client"

import { Zap } from "lucide-react"
import { useExpertMode } from "@/lib/hooks/use-expert-mode"
import { cn } from "@/lib/utils"

interface ExpertModeToggleProps {
  className?: string
}

export function ExpertModeToggle({ className }: ExpertModeToggleProps) {
  const { isExpert, toggle } = useExpertMode()

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all border",
        isExpert
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
        className
      )}
      title={isExpert ? "Mode expert activé — toutes les étapes visibles" : "Activer le mode expert"}
    >
      <Zap className={cn("size-3", isExpert && "fill-amber-500 text-amber-500")} />
      Expert
    </button>
  )
}
