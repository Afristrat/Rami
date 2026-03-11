"use client"

import { cn } from "@/lib/utils"
import { VOICE_TONES } from "@/lib/schemas/brand-dna.schema"

interface VoiceTonePickerProps {
  value: string
  onChange: (id: string) => void
  error?: string
}

export function VoiceTonePicker({ value, onChange, error }: VoiceTonePickerProps) {
  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {VOICE_TONES.map((tone) => {
          const isSelected = value === tone.id
          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => onChange(tone.id)}
              className={cn(
                "group flex w-full gap-3 rounded-xl border-2 p-3.5 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <span className="mt-0.5 text-2xl leading-none">{tone.icon}</span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {tone.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                  {tone.description}
                </p>
                {isSelected && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tone.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "mt-0.5 size-4 shrink-0 rounded-full border-2 transition-colors",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-border group-hover:border-primary/50"
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
