"use client"

import { useState, useTransition } from "react"
import { Bell, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  updateNotificationPreferencesAction,
  type NotificationPreferences,
} from "@/lib/actions/settings.actions"

interface NotificationPreferencesFormProps {
  initialPrefs: NotificationPreferences
}

interface NotifItem {
  key: keyof NotificationPreferences
  label: string
  description: string
}

const NOTIF_GROUPS: Array<{
  title: string
  description: string
  items: NotifItem[]
}> = [
  {
    title: "Activité de publication",
    description: "Notifications liées à vos posts et publications.",
    items: [
      {
        key: "emailPostPublished",
        label: "Publication réussie",
        description: "Recevoir un email quand un post est publié avec succès.",
      },
      {
        key: "emailPostFailed",
        label: "Échec de publication",
        description: "Être alerté si un post ne peut pas être publié.",
      },
    ],
  },
  {
    title: "Compte et équipe",
    description: "Notifications liées à votre compte RAMI.",
    items: [
      {
        key: "emailQuotaWarning",
        label: "Alerte de quota",
        description: "Recevoir un email à 80% et 95% de votre quota mensuel.",
      },
      {
        key: "emailTeamInvite",
        label: "Invitations équipe",
        description: "Être notifié quand quelqu'un accepte votre invitation.",
      },
      {
        key: "emailBilling",
        label: "Facturation",
        description: "Reçevoir les factures et alertes de renouvellement.",
      },
    ],
  },
  {
    title: "Conseils et rapports",
    description: "Emails d'amélioration et de suivi de performance.",
    items: [
      {
        key: "emailWeeklyDigest",
        label: "Récapitulatif hebdomadaire",
        description: "Un résumé de vos performances chaque lundi matin.",
      },
      {
        key: "emailBrandDnaTips",
        label: "Conseils Brand DNA",
        description: "Des recommandations pour améliorer votre cohérence visuelle.",
      },
    ],
  },
]

export function NotificationPreferencesForm({
  initialPrefs,
}: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggle(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction(prefs)
      if (!result.error) setSaved(true)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4" />
            Préférences email
          </CardTitle>
          <CardDescription>
            Choisissez les emails que vous souhaitez recevoir de RAMI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {NOTIF_GROUPS.map((group, groupIndex) => (
            <div key={group.title}>
              {groupIndex > 0 && <Separator />}
              <div className="px-4 pt-5 pb-2">
                <p className="text-sm font-medium">{group.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
              </div>
              <ul className="space-y-px pb-4">
                {group.items.map((item, itemIndex) => (
                  <li key={item.key}>
                    {itemIndex > 0 && <Separator className="mx-4" />}
                    <div className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{item.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <Switch
                        checked={prefs[item.key]}
                        onCheckedChange={() => toggle(item.key)}
                        disabled={isPending}
                        className="mt-0.5 shrink-0"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Préférences enregistrées
          </div>
        )}
        {!saved && <div />}
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  )
}
