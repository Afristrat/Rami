import { Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Leads — RAMI",
  description: "Génération et enrichissement de leads via Apollo.io.",
}

export default function LeadsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] gap-6 text-center px-4">
      <div className="flex items-center justify-center size-20 rounded-2xl bg-white/[0.06] border border-white/[0.08]">
        <Users className="size-10 text-emerald-400" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Leads
          </h1>
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            Agency
          </Badge>
        </div>
        <p className="text-4xl font-extrabold text-white/10 tracking-widest uppercase mt-1">
          Coming Soon
        </p>
        <p className="text-white/50 max-w-sm mt-2">
          Recherchez, enrichissez et gérez vos prospects directement depuis
          RAMI grâce à l'intégration Apollo.io — sans quitter votre workflow.
        </p>
      </div>

      <Button asChild className="bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white font-semibold px-6">
        <Link href="/pricing">Passer au plan Agency</Link>
      </Button>
    </div>
  )
}
