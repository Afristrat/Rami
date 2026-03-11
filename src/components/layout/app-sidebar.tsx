import { SidebarContent } from "./sidebar-content"

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 md:flex md:flex-col border-r border-sidebar-border bg-sidebar">
      <SidebarContent />
    </aside>
  )
}
