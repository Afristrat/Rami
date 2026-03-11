import { Suspense } from 'react'
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { QuotaBadge } from "@/components/billing/quota-badge"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader>
          {/* QuotaBadge : rendu serveur dans un slot du header */}
          <Suspense fallback={null}>
            <QuotaBadge />
          </Suspense>
        </AppHeader>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
