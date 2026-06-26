// ============================================================
// Layout commun aux pages légales RAMI (route group `(public)/legal`).
// Contenu en français statique (pas de clés de traduction).
// Le <html lang> et le thème sont gérés par le layout racine.
// ============================================================

import type { ReactNode } from "react"
import Link from "next/link"
import { LAST_UPDATED } from "@/lib/legal/company"

const LEGAL_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/legal/mentions-legales", label: "Mentions légales" },
  { href: "/legal/confidentialite", label: "Confidentialité" },
  { href: "/legal/cgu", label: "CGU" },
  { href: "/legal/cgv", label: "CGV" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/sous-traitants", label: "Sous-traitants" },
]

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* En-tête */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            RAMI
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Navigation entre les pages légales */}
      <nav
        aria-label="Pages légales"
        className="border-b border-zinc-200 dark:border-zinc-800"
      >
        <ul className="mx-auto flex max-w-3xl flex-wrap gap-x-4 gap-y-2 px-4 py-3 text-sm">
          {LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-zinc-600 transition hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Contenu — typographie stylée manuellement (pas de plugin `prose`). */}
      <main className="mx-auto max-w-3xl px-4 py-10">
        <article
          className={[
            "max-w-none text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300",
            "[&_h1]:mb-6 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-100",
            "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100",
            "[&_p]:my-4",
            "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6",
            "[&_strong]:font-semibold [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100",
            "[&_a]:font-medium [&_a]:text-violet-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-violet-700 dark:[&_a]:text-violet-400 dark:hover:[&_a]:text-violet-300",
          ].join(" ")}
        >
          {children}
        </article>
      </main>

      {/* Pied de page */}
      <footer className="mt-8 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-8 text-sm text-zinc-500">
          <p>Dernière mise à jour : {LAST_UPDATED}.</p>
          <p className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            La version française de ce document fait foi. Ces informations sont
            fournies à titre d&apos;information ; pour toute question relative à
            vos données, contactez{" "}
            <a
              href="mailto:privacy@ai-mpower.com"
              className="font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              privacy@ai-mpower.com
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}
