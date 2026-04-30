import { redirect } from "next/navigation"

/**
 * Redirection silencieuse : /admin → /admin/dashboard
 */
export default function AdminIndexPage() {
  redirect("/admin/dashboard")
}
