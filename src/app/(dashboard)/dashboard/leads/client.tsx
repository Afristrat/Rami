"use client"

import { useState } from "react"
import type { LeadsByStage } from "@/lib/schemas/lead.schema"
import { KanbanBoard } from "@/components/leads/KanbanBoard"
import { LeadFilters, ApolloSearchFilters } from "@/components/leads/LeadFilters"

interface LeadsPageClientProps {
  initialData: LeadsByStage
}

export function LeadsPageClient({ initialData }: LeadsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "mine" | "priority">("all")

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header + Filtres */}
      <LeadFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onImport={() => {
          /* Placeholder pour l'import Apollo */
        }}
      />

      {/* Kanban board + détail */}
      <KanbanBoard initialData={initialData} searchQuery={searchQuery} />

      {/* Filtres avancés Apollo */}
      <ApolloSearchFilters
        onSearch={() => {
          /* Placeholder pour la recherche Apollo */
        }}
      />
    </div>
  )
}
