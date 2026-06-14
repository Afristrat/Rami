import { redirect } from "next/navigation"

// L'ancienne page /dashboard/video était une démo 100 % factice (pipeline, voix,
// storyboard et waveform simulés, boutons sans action). Le générateur vidéo RÉEL
// vit à /create/video. On redirige donc toute visite vers l'outil fonctionnel.
export default function DashboardVideoRedirect() {
  redirect("/create/video")
}
