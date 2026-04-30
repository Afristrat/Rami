"use client"

import { Download } from "lucide-react"
import { useTranslations } from "next-intl"
import type { BrandDnaFormData } from "@/lib/schemas/brand-dna.schema"

interface Props {
  initialData: BrandDnaFormData
}

export function BrandDnaOverviewClient({ initialData }: Props) {
  const t = useTranslations("brandDna")

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(initialData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brand-dna-${initialData.brandName?.toLowerCase().replace(/\s+/g, "-") ?? "export"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExportJson}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-muted-foreground font-semibold rounded-lg hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/5 transition-all text-sm"
    >
      <Download className="size-4" />
      {t("exportJson")}
    </button>
  )
}
