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
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Decorative background — dark mode only */}
      <div className="fixed inset-0 rami-grid-pattern pointer-events-none z-0" />
      <div className="rami-blob top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rami-violet" />
      <div className="rami-blob bottom-[-10%] right-[10%] w-[35%] h-[35%] bg-rami-blue" />
      <div className="rami-blob top-[20%] right-[-5%] w-[30%] h-[30%] bg-rami-violet" />

      <AppSidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <AppHeader>
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
