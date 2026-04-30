import { SettingsNav } from "@/components/settings/settings-nav"
import { SettingsLayoutClient } from "@/components/settings/settings-layout-client"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full">
      <SettingsLayoutClient />
      <SettingsNav />
      <div className="mt-8">{children}</div>
    </div>
  )
}
