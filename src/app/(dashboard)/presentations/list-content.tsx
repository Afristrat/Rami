"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Presentation, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PresentationsListContent() {
  const t = useTranslations("presentations")

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] gap-6 text-center px-4">
      <div className="flex items-center justify-center size-20 rounded-2xl bg-muted/50 border border-border">
        <Presentation className="size-10 text-primary" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-muted-foreground max-w-sm mt-2">
          {t("subtitleFull")}
        </p>
      </div>

      <Link href="/presentations/new">
        <Button className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 text-white font-semibold px-6 h-10 gap-2">
          <Plus className="size-4" />
          {t("newPresentation")}
        </Button>
      </Link>
    </div>
  )
}
