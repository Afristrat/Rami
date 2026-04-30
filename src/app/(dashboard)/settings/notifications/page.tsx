import { redirect } from "next/navigation"

// Notifications are now part of the Général tab
export default function NotificationsPage() {
  redirect("/settings/profile")
}
