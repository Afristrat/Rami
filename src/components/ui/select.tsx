import * as React from "react"
import { cn } from "@/lib/utils"

function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-8 w-full appearance-none rounded-lg border border-input bg-background px-2.5 py-1 pr-8 text-sm text-foreground shadow-xs",
        "ring-offset-background transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-[right_0.5rem_center] bg-no-repeat",
        className
      )}
      {...props}
    />
  )
}

export { Select }
