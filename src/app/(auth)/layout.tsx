import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "RAMI — Accès",
  description: "Agency OS by AI-MPower — Connectez-vous à votre espace.",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Gradient d'ambiance */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/6 blur-3xl" />
      </div>

      {/* Grille subtile */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="relative py-4 text-center text-xs text-white/20">
        © 2026 AI-MPower Consulting — RAMI v1.0
      </footer>
    </div>
  )
}
