"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function WelcomeToast({ tenantName }: { tenantName?: string }) {
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get("welcome") === "1"

  useEffect(() => {
    if (isWelcome) {
      toast.success(
        tenantName
          ? `Espace "${tenantName}" créé avec succès !`
          : "Votre espace a été créé avec succès !",
        {
          description: "Brand DNA, visuels, publications — tout est prêt à démarrer.",
          duration: 6000,
        }
      )
    }
  }, [isWelcome, tenantName])

  return null
}
