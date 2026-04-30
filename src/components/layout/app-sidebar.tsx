import { SidebarContent } from "./sidebar-content"

export function AppSidebar() {
  return (
    <aside className="hidden w-[260px] shrink-0 md:flex md:flex-col border-e border-sidebar-border bg-sidebar backdrop-blur-md relative z-20">
      <SidebarContent />
    </aside>
  )
}
