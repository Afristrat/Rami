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
    <div className="flex h-screen w-full overflow-hidden">
      {/* ═══════ Left Panel — Branding (55%) ═══════ */}
      <div className="relative hidden lg:flex w-[55%] flex-col items-center justify-center overflow-hidden bg-[#f7f6f8] dark:bg-[#0A0A0F] border-r border-black/5 dark:border-white/5">
        {/* Grid pattern */}
        <div className="absolute inset-0 rami-grid-pattern" />

        {/* Gradient blobs */}
        <div className="rami-blob absolute top-1/4 left-1/4 size-96 bg-[#7c3bed]" />
        <div className="rami-blob absolute bottom-1/4 right-1/4 size-96 bg-[#2563eb]" />
        <div className="rami-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 bg-[#7c3bed]/50" />

        {/* Center content — logo + tagline */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="mb-6 flex flex-col items-center">
            <h1 className="text-6xl font-bold tracking-tighter text-gray-900 dark:text-white">
              RAMI
            </h1>
            <div className="mt-2 h-1.5 w-24 rounded-full bg-gradient-to-r from-[#7c3bed] to-[#2563eb]" />
          </div>
          <p className="text-xl font-medium text-gray-500 dark:text-white/60 tracking-wide">
            L&apos;IA qui vise juste.
          </p>
        </div>

        {/* Bottom decorative card */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-center opacity-10 dark:opacity-20">
          <div className="h-48 w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent backdrop-blur-sm" />
        </div>
      </div>

      {/* ═══════ Right Panel — Form (45%) ═══════ */}
      <div className="flex w-full lg:w-[45%] flex-col items-center justify-center bg-[#f7f6f8] dark:bg-[#0F0F14] px-6 py-12 overflow-y-auto">
        {/* Mobile logo — visible only on small screens */}
        <div className="lg:hidden mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">RAMI</h1>
          <div className="mt-1 h-1 w-16 rounded-full bg-gradient-to-r from-[#7c3bed] to-[#2563eb]" />
        </div>

        {/* Form slot */}
        <div className="w-full max-w-[440px]">
          {children}
        </div>

        {/* Bottom legal links */}
        <div className="mt-12 flex gap-6 text-xs text-gray-400 dark:text-white/20">
          <a href="/legal/cgu" className="hover:text-gray-600 dark:hover:text-white/40 transition-colors">
            Conditions d&apos;utilisation
          </a>
          <a href="/legal/confidentialite" className="hover:text-gray-600 dark:hover:text-white/40 transition-colors">
            Confidentialité
          </a>
        </div>
      </div>
    </div>
  )
}
