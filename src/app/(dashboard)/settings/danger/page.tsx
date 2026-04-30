import { redirect } from "next/navigation"

// Danger zone is now part of the Général tab
export default function DangerPage() {
  redirect("/settings/profile")
}
