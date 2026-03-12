#!/usr/bin/env tsx
/**
 * RAMI — Smoke tests pré-déploiement (SOP-006, étape 9)
 *
 * Vérifie que les routes critiques de l'app répondent correctement.
 * À lancer après le déploiement sur staging avant le push production.
 *
 * Usage :
 *   npx tsx scripts/smoke-test.ts [BASE_URL]
 *   npx tsx scripts/smoke-test.ts https://rami-staging.ai-mpower.com
 *   npx tsx scripts/smoke-test.ts http://localhost:3000   (dev local)
 */

const BASE_URL = process.argv[2] ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

interface SmokeTest {
  name: string
  method: "GET" | "POST"
  path: string
  expectedStatus: number
  expectedBody?: string
  headers?: Record<string, string>
}

const TESTS: SmokeTest[] = [
  // ── Pages publiques ──────────────────────────────────────────────────────
  { name: "Page d'accueil", method: "GET", path: "/", expectedStatus: 200 },
  { name: "Page pricing", method: "GET", path: "/pricing", expectedStatus: 200 },
  { name: "Page login", method: "GET", path: "/login", expectedStatus: 200 },
  { name: "Page register", method: "GET", path: "/register", expectedStatus: 200 },

  // ── SEO ──────────────────────────────────────────────────────────────────
  { name: "robots.txt", method: "GET", path: "/robots.txt", expectedStatus: 200, expectedBody: "User-agent" },
  { name: "sitemap.xml", method: "GET", path: "/sitemap.xml", expectedStatus: 200, expectedBody: "urlset" },

  // ── Health check ─────────────────────────────────────────────────────────
  { name: "Health endpoint", method: "GET", path: "/api/health", expectedStatus: 200, expectedBody: '"status"' },

  // ── Auth — redirect attendu (302/307) ────────────────────────────────────
  { name: "Dashboard → redirect login", method: "GET", path: "/dashboard", expectedStatus: 307 },
  { name: "Settings → redirect login", method: "GET", path: "/settings", expectedStatus: 307 },

  // ── API — auth requis ────────────────────────────────────────────────────
  {
    name: "API queue/publish — 401 sans auth",
    method: "POST",
    path: "/api/queue/publish",
    expectedStatus: 401,
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "API cron/stripe-reconcile — 401 sans secret",
    method: "GET",
    path: "/api/cron/stripe-reconcile",
    expectedStatus: 401,
  },
]

// ── Runner ────────────────────────────────────────────────────────────────────

interface TestResult {
  name: string
  passed: boolean
  status?: number
  error?: string
}

async function runTest(test: SmokeTest): Promise<TestResult> {
  try {
    const url = `${BASE_URL}${test.path}`
    const response = await fetch(url, {
      method: test.method,
      headers: { "User-Agent": "RAMI-SmokeTest/1.0", ...test.headers },
      redirect: "manual", // Ne pas suivre les redirects
      body: test.method === "POST" ? JSON.stringify({}) : undefined,
      signal: AbortSignal.timeout(10000),
    })

    if (response.status !== test.expectedStatus) {
      return {
        name: test.name,
        passed: false,
        status: response.status,
        error: `Status ${response.status} ≠ attendu ${test.expectedStatus}`,
      }
    }

    if (test.expectedBody) {
      const body = await response.text()
      if (!body.includes(test.expectedBody)) {
        return {
          name: test.name,
          passed: false,
          status: response.status,
          error: `Body ne contient pas "${test.expectedBody}"`,
        }
      }
    }

    return { name: test.name, passed: true, status: response.status }
  } catch (err) {
    return { name: test.name, passed: false, error: String(err) }
  }
}

async function main(): Promise<void> {
  console.log(`\n🔥 RAMI Smoke Tests — ${BASE_URL}\n`)
  console.log(`   ${TESTS.length} tests à exécuter...\n`)

  const results = await Promise.all(TESTS.map(runTest))

  let passed = 0
  let failed = 0

  for (const result of results) {
    if (result.passed) {
      console.log(`  ✅ ${result.name} (${result.status})`)
      passed++
    } else {
      console.log(`  ❌ ${result.name} — ${result.error}`)
      failed++
    }
  }

  console.log(`\n═══════════════════════════════════════════════`)
  console.log(`  Résultat : ${passed}/${results.length} tests passent`)

  if (failed > 0) {
    console.log(`  ❌ ${failed} tests échouent — NE PAS déployer en production`)
    process.exit(1)
  } else {
    console.log(`  ✅ Tous les tests passent — Prêt pour le déploiement production`)
  }

  console.log(`═══════════════════════════════════════════════\n`)
}

main().catch((err) => {
  console.error("Erreur inattendue :", err)
  process.exit(1)
})
