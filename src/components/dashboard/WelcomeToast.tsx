"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

export function WelcomeToast({ tenantName }: { tenantName?: string }) {
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get("welcome") === "1"
  const t = useTranslations("dashboard")

  useEffect(() => {
    if (isWelcome) {
      toast.success(
        tenantName
          ? t("welcomeTenantCreated", { name: tenantName })
          : t("welcomeSpaceCreated"),
        {
          description: t("welcomeDescription"),
          duration: 6000,
        }
      )
    }
  }, [isWelcome, tenantName, t])

  return null
}
