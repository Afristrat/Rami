import { LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <LayoutDashboard className="size-4" />
          <span className="text-sm">Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Bonjour, Amine 👋</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue sur RAMI — votre Agency OS.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Posts publiés", value: "0", sub: "ce mois" },
          { label: "Visuels générés", value: "0", sub: "ce mois" },
          { label: "Tenants actifs", value: "3", sub: "sur 10 max" },
          { label: "Score Brand DNA", value: "—", sub: "à configurer" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Commencez par configurer votre{" "}
          <a href="/dashboard/brand-dna" className="font-medium text-primary hover:underline">
            Brand DNA
          </a>{" "}
          pour générer du contenu ciblé.
        </p>
      </div>
    </div>
  )
}
