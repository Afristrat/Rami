"use client"

import { useState, useTransition } from "react"
import { Bell, Loader2, CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
  labelKey: string
  descriptionKey: string
}

export function NotificationPreferencesForm({
  initialPrefs,
}: NotificationPreferencesFormProps) {
  const t = useTranslations("settings.notificationsSection")
  const tSettings = useTranslations("settings")

  const NOTIF_GROUPS: Array<{
    titleKey: string
    descriptionKey: string
    items: NotifItem[]
  }> = [
    {
      titleKey: "publishingActivity",
      descriptionKey: "publishingActivityDesc",
      items: [
        {
          key: "emailPostPublished",
          labelKey: "postPublished",
          descriptionKey: "postPublishedDesc",
        },
        {
          key: "emailPostFailed",
          labelKey: "postFailed",
          descriptionKey: "postFailedDesc",
        },
      ],
    },
    {
      titleKey: "accountAndTeam",
      descriptionKey: "accountAndTeamDesc",
      items: [
        {
          key: "emailQuotaWarning",
          labelKey: "quotaWarning",
          descriptionKey: "quotaWarningDesc",
        },
        {
          key: "emailTeamInvite",
          labelKey: "teamInvite",
          descriptionKey: "teamInviteDesc",
        },
        {
          key: "emailBilling",
          labelKey: "billingNotif",
          descriptionKey: "billingNotifDesc",
        },
      ],
    },
    {
      titleKey: "tipsAndReports",
      descriptionKey: "tipsAndReportsDesc",
      items: [
        {
          key: "emailWeeklyDigest",
          labelKey: "weeklyReport",
          descriptionKey: "weeklyReportDesc",
        },
        {
          key: "emailBrandDnaTips",
          labelKey: "brandDnaTips",
          descriptionKey: "brandDnaTipsDesc",
        },
      ],
    },
  ]

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
            {t("emailPreferences")}
          </CardTitle>
          <CardDescription>
            {t("emailPreferencesSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {NOTIF_GROUPS.map((group, groupIndex) => (
            <div key={group.titleKey}>
              {groupIndex > 0 && <Separator />}
              <div className="px-4 pt-5 pb-2">
                <p className="text-sm font-medium">{t(group.titleKey)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(group.descriptionKey)}</p>
              </div>
              <ul className="space-y-px pb-4">
                {group.items.map((item, itemIndex) => (
                  <li key={item.key}>
                    {itemIndex > 0 && <Separator className="mx-4" />}
                    <div className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{t(item.labelKey)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t(item.descriptionKey)}
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
            {t("preferencesSaved")}
          </div>
        )}
        {!saved && <div />}
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? tSettings("savingButton") : tSettings("saveButton")}
        </Button>
      </div>
    </div>
  )
}
