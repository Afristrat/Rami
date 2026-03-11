import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre compte, vos connexions et les préférences de votre espace RAMI.
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <aside className="lg:w-48 shrink-0">
          <SettingsNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
