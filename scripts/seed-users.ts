/**
 * RAMI — Script de seed utilisateurs
 * ============================================================
 * Crée 5 utilisateurs de test représentant les personas RAMI :
 *
 *  1. Amine        super_admin       amine@ai-mpower.com      Admin2026!
 *  2. Sarah        agency            sarah@agence-casa.ma     Test2026!
 *  3. Karim        pro               karim@consultant.ma      Test2026!
 *  4. Fatima       solo              fatima@coach-ma.com      Test2026!
 *  5. Youssef      free              youssef@startup.tn       Test2026!
 *
 * Usage : npx tsx scripts/seed-users.ts
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charger .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Variables NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Données utilisateurs ──────────────────────────────────────────────────────

const USERS = [
  {
    email: 'amine@ai-mpower.com',
    password: 'Admin2026!',
    display_name: 'Amine Mansouri',
    global_role: 'super_admin' as const,
    tenant: {
      name: 'AI-MPower',
      slug: 'ai-mpower',
      plan: 'agency_plus' as const,
    },
    brand_dna: {
      identity: {
        name: 'AI-MPower',
        sector: 'tech',
        positioning: 'Cabinet de conseil IA pour entreprises africaines et MENA',
        usp: 'Seul cabinet alliant IA générative et expertise neuropsychologique',
        tagline: 'L\'IA qui vise juste.',
      },
      audience: [
        { name: 'Sarah', role: 'Directrice agence digitale', aspirations: 'Automatiser la création de contenu sans perdre l\'âme de la marque' },
        { name: 'Karim', role: 'Consultant marketing B2B', aspirations: 'Livrer des visuels premium sans sous-traiter le design' },
      ],
      color_palette: [
        { hex: '#6D28D9', name: 'Violet IA', emotion: 'expertise', role: 'primary' },
        { hex: '#2563EB', name: 'Bleu confiance', emotion: 'confiance', role: 'secondary' },
        { hex: '#0F172A', name: 'Nuit profonde', emotion: 'autorité', role: 'background' },
        { hex: '#F8FAFC', name: 'Blanc lumineux', emotion: 'clarté', role: 'text' },
      ],
      cognitive_objective: 'expertise',
      editorial_tone: { register: 'professionnel', style: 'direct, sans jargon, orienté résultats' },
      active_platforms: ['linkedin', 'instagram', 'youtube'],
      culture_markets: { primary_culture: 'maroc', secondary_cultures: ['europe_francophone', 'afrique_subsaharienne'] },
    },
  },
  {
    email: 'sarah@agence-casa.ma',
    password: 'Test2026!',
    display_name: 'Sarah El Mansouri',
    global_role: 'user' as const,
    tenant: {
      name: 'Agence Digitale Casa',
      slug: 'agence-casa',
      plan: 'agency' as const,
    },
    brand_dna: {
      identity: {
        name: 'Agence Digitale Casa',
        sector: 'agences',
        positioning: 'Agence créative full-service pour marques marocaines ambitieuses',
        usp: 'La seule agence qui fusionne design neuropsychologique et performance data',
        tagline: 'Votre marque, amplifiée.',
      },
      audience: [
        { name: 'Marques premium', role: 'PME et groupes', aspirations: 'Contenu haut de gamme à la vitesse des réseaux sociaux' },
        { name: 'Startups tech', role: 'Fondateurs', aspirations: 'Brand premium dès le jour 1 sans budget agence classique' },
      ],
      color_palette: [
        { hex: '#D4AF37', name: 'Or Chérifien', emotion: 'prestige', role: 'primary' },
        { hex: '#1A1A2E', name: 'Nuit Casablanca', emotion: 'sophistication', role: 'background' },
        { hex: '#E8E8E8', name: 'Gris perle', emotion: 'élégance', role: 'secondary' },
        { hex: '#C0392B', name: 'Rouge courage', emotion: 'identité', role: 'accent' },
      ],
      cognitive_objective: 'aspiration',
      editorial_tone: { register: 'premium', style: 'inspirant, visionnaire, ancré dans la culture marocaine' },
      active_platforms: ['instagram', 'linkedin', 'facebook', 'tiktok'],
      culture_markets: { primary_culture: 'maroc', secondary_cultures: ['afrique_subsaharienne'] },
    },
  },
  {
    email: 'karim@consultant.ma',
    password: 'Test2026!',
    display_name: 'Karim Benali',
    global_role: 'user' as const,
    tenant: {
      name: 'Karim Benali Consulting',
      slug: 'karim-consulting',
      plan: 'pro' as const,
    },
    brand_dna: {
      identity: {
        name: 'Karim Benali Consulting',
        sector: 'conseil',
        positioning: 'Consultant marketing B2B indépendant — transformation digitale des PME',
        usp: 'ROI mesurable en 90 jours ou remboursé',
        tagline: 'Des résultats, pas des promesses.',
      },
      audience: [
        { name: 'Dirigeants PME', role: 'CEO / DG', aspirations: 'Croissance prévisible et scalable' },
      ],
      color_palette: [
        { hex: '#1E3A5F', name: 'Bleu marine', emotion: 'confiance', role: 'primary' },
        { hex: '#F59E0B', name: 'Ambre action', emotion: 'urgence', role: 'accent' },
        { hex: '#FFFFFF', name: 'Blanc', emotion: 'clarté', role: 'background' },
      ],
      cognitive_objective: 'confiance',
      editorial_tone: { register: 'expert', style: 'factuel, chiffres, cas concrets' },
      active_platforms: ['linkedin', 'twitter'],
      culture_markets: { primary_culture: 'maroc', secondary_cultures: ['europe_francophone'] },
    },
  },
  {
    email: 'fatima@coach-ma.com',
    password: 'Test2026!',
    display_name: 'Fatima Zahra Alaoui',
    global_role: 'user' as const,
    tenant: {
      name: 'Fatima Zahra Coach',
      slug: 'fatima-coach',
      plan: 'solo' as const,
    },
    brand_dna: {
      identity: {
        name: 'Fatima Zahra Alaoui',
        sector: 'coaching',
        positioning: 'Coach entrepreneuse — accompagnement femmes qui lancent leur business',
        usp: 'Méthode HIMA : 90 jours pour valider et lancer votre offre',
        tagline: 'Ton business, ta liberté.',
      },
      audience: [
        { name: 'Nadia', role: 'Femme au foyer reconvertie', aspirations: 'Indépendance financière, business en ligne' },
      ],
      color_palette: [
        { hex: '#C2185B', name: 'Rose fushia', emotion: 'énergie féminine', role: 'primary' },
        { hex: '#F3E5F5', name: 'Lavande douce', emotion: 'sérénité', role: 'secondary' },
        { hex: '#FFF8E1', name: 'Crème chaud', emotion: 'chaleur', role: 'background' },
      ],
      cognitive_objective: 'communaute',
      editorial_tone: { register: 'chaleureux', style: 'authentique, direct, encourageant, darija friendly' },
      active_platforms: ['instagram', 'facebook'],
      culture_markets: { primary_culture: 'maroc', secondary_cultures: [] },
    },
  },
  {
    email: 'youssef@startup.tn',
    password: 'Test2026!',
    display_name: 'Youssef Ben Salah',
    global_role: 'user' as const,
    tenant: {
      name: 'PayLink Tunisia',
      slug: 'paylink-tn',
      plan: 'free' as const,
    },
    brand_dna: null, // Pas encore configuré — onboarding à compléter
  },
]

// ── Données posts de démo ──────────────────────────────────────────────────────

function getSamplePosts(tenantId: string, userId: string) {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 86400000)
  const tomorrow = new Date(now.getTime() + 86400000)
  const nextWeek = new Date(now.getTime() + 7 * 86400000)

  return [
    {
      tenant_id: tenantId,
      created_by: userId,
      title: 'Lancement nouveau service Brand DNA',
      content: `🧠 Votre identité de marque, construite sur la science.\n\nAprès 6 mois de R&D, nous lançons notre service Brand DNA — une analyse neuropsychologique complète de votre marque.\n\n✅ Palette couleurs calibrée par émotion cible\n✅ Positionnement différenciateur validé\n✅ 4 directions visuelles générées en 30 secondes\n\nLes 10 premiers clients bénéficient d'un audit gratuit.\n\nCommentez "ADN" pour recevoir le guide complet 👇\n\n#BrandDNA #MarketingDigital #Maroc #IA #Casablanca`,
      platforms: ['linkedin', 'instagram'],
      status: 'published',
      published_at: yesterday.toISOString(),
      ai_metadata: {
        direction: 'Blueprint Scientifique',
        brand_dna_score: 87,
        provider: 'fal_ai',
        cognitive_objective: 'expertise',
      },
    },
    {
      tenant_id: tenantId,
      created_by: userId,
      title: 'Témoignage client — Résultats 30 jours',
      content: `📊 30 jours. +340% d'engagement organique.\n\nQuand Sophia (DG d'une enseigne retail à Casablanca) est venue nous voir, son Instagram stagnait à 1,2% d'engagement.\n\nOn a recalibré :\n→ Palette couleurs (rouge → terracotta chaud)\n→ Format (photo produit → lifestyle aspirationnel)\n→ Timing (18h → 20h30 heure marocaine)\n\nRésultat en 30 jours : 4,7% d'engagement, +2 300 abonnés organiques.\n\nLa science des couleurs, c'est pas de la magie. C'est de la méthode.\n\n#CasStudy #ResultatsConcrets #SocialMedia #Maroc`,
      platforms: ['linkedin'],
      status: 'scheduled',
      scheduled_at: tomorrow.toISOString(),
      ai_metadata: {
        direction: 'Machine Narratif',
        brand_dna_score: 92,
        provider: 'replicate',
        cognitive_objective: 'confiance',
      },
    },
    {
      tenant_id: tenantId,
      created_by: userId,
      title: 'Tips hebdomadaire — Psychologie des couleurs',
      content: `🎨 Pourquoi le bleu convertit 3x mieux que le rouge dans le B2B ?\n\nLa réponse est dans la neuropsychologie :\n\n• Bleu → active l'amygdale en mode "sécurité" → confiance, fiabilité\n• Rouge → active l'amygdale en mode "alerte" → urgence, mais aussi méfiance\n\nPour une landing page B2B :\n✓ Bleu marine (#1E3A5F) pour le CTA principal\n✗ Évitez le rouge sauf pour les promotions flash\n\nVous testez quelles couleurs sur vos créas ? 👇`,
      platforms: ['twitter', 'linkedin'],
      status: 'draft',
      ai_metadata: {
        direction: 'Dashboard Expertise',
        brand_dna_score: 78,
        provider: 'together_ai',
        cognitive_objective: 'expertise',
      },
    },
    {
      tenant_id: tenantId,
      created_by: userId,
      title: 'Contenu Ramadan — Série spéciale',
      content: `🌙 Ramadan Kareem à toute notre communauté.\n\nEn ce mois béni, nous réduisons nos tarifs de 30% pour les startups marocaines et africaines.\n\nParce que construire une marque forte, c'est un acte de foi en soi-même.\n\n✨ Offre valable jusqu'au 27ème jour du Ramadan\n📲 DM "RAMADAN" pour les détails\n\nبارك الله فيكم 🤲`,
      platforms: ['instagram', 'facebook'],
      status: 'draft',
      ai_metadata: {
        direction: 'Carte & Aspiration',
        brand_dna_score: 95,
        provider: 'fal_ai',
        cognitive_objective: 'communaute',
      },
    },
    {
      tenant_id: tenantId,
      created_by: userId,
      title: 'Webinar — Brand DNA pour agences',
      content: `📅 Webinar GRATUIT — Jeudi 20 mars à 19h\n\n"Comment construire le Brand DNA de vos clients en 2 heures avec l'IA"\n\nAu programme :\n→ Matrice Causse : couleurs × émotions × cultures\n→ Live demo RAMI : génération de 20 visuels en 30s\n→ Workflow agence : de l'onboarding au livrable\n\n💡 Places limitées à 50 participants\n\n👇 Lien d'inscription en commentaire\n\n#Webinar #IA #Marketing #Agences #Maroc`,
      platforms: ['linkedin', 'instagram'],
      status: 'scheduled',
      scheduled_at: nextWeek.toISOString(),
      ai_metadata: {
        direction: 'Blueprint Scientifique',
        brand_dna_score: 83,
        provider: 'fal_ai',
        cognitive_objective: 'expertise',
      },
    },
  ]
}

// ── Fonctions utilitaires ──────────────────────────────────────────────────────

function log(emoji: string, msg: string) {
  console.log(`${emoji}  ${msg}`)
}

function success(msg: string) { log('✅', msg) }
function info(msg: string) { log('ℹ️', msg) }
function warn(msg: string) { log('⚠️', msg) }
function error(msg: string) { log('❌', msg) }

// ── Script principal ──────────────────────────────────────────────────────────

async function seed() {
  console.log('\n════════════════════════════════════════════════════')
  console.log('  RAMI — Seed utilisateurs de démonstration')
  console.log('════════════════════════════════════════════════════\n')

  const createdUsers: Array<{ userId: string; tenantId: string; name: string }> = []

  for (const userData of USERS) {
    console.log(`\n── ${userData.display_name} (${userData.email}) ──`)

    // 1. Créer l'utilisateur via Supabase Auth Admin
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.display_name,
      },
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        warn(`Utilisateur ${userData.email} existe déjà — récupération de l'ID existant`)

        // Récupérer l'utilisateur existant
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existing = existingUsers?.users.find((u) => u.email === userData.email)

        if (!existing) {
          error(`Impossible de récupérer l'utilisateur ${userData.email}`)
          continue
        }

        // Récupérer son tenant
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('owner_id', existing.id)
          .single()

        if (existingTenant) {
          createdUsers.push({ userId: existing.id, tenantId: existingTenant.id, name: userData.display_name })
          info(`Utilisateur et tenant existants récupérés`)
        }
        continue
      }

      error(`Erreur création auth ${userData.email}: ${authError.message}`)
      continue
    }

    const userId = authUser.user.id
    success(`Auth créé — ID: ${userId}`)

    // 2. Mettre à jour le profil (global_role)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ global_role: userData.global_role, display_name: userData.display_name })
      .eq('id', userId)

    if (profileError) {
      warn(`Profil update échoué: ${profileError.message}`)
      // Tenter un insert si le profil n'existe pas encore
      await supabase.from('profiles').upsert({
        id: userId,
        email: userData.email,
        display_name: userData.display_name,
        global_role: userData.global_role,
      })
    } else {
      success(`Profil mis à jour — rôle: ${userData.global_role}`)
    }

    // 3. Créer le tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: userData.tenant.name,
        slug: userData.tenant.slug,
        owner_id: userId,
        plan: userData.tenant.plan,
        brand_dna: userData.brand_dna ?? null,
        is_active: true,
        generation_count: userData.tenant.plan === 'free' ? 0 : Math.floor(Math.random() * 15),
      })
      .select('id')
      .single()

    if (tenantError) {
      if (tenantError.message.includes('unique') || tenantError.message.includes('duplicate')) {
        warn(`Tenant "${userData.tenant.slug}" existe déjà`)
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', userData.tenant.slug)
          .single()
        if (existingTenant) {
          createdUsers.push({ userId, tenantId: existingTenant.id, name: userData.display_name })
        }
        continue
      }
      error(`Erreur création tenant: ${tenantError.message}`)
      continue
    }

    const tenantId = tenant.id
    success(`Tenant créé — "${userData.tenant.name}" (${userData.tenant.plan}) — ID: ${tenantId}`)

    // 4. Lier l'utilisateur au tenant (table users publique)
    const { error: userLinkError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.display_name,
        tenant_id: tenantId,
        role: userData.global_role === 'super_admin' ? 'agency_owner' : 'agency_owner',
        onboarding_completed: userData.brand_dna !== null,
      })

    if (userLinkError) {
      warn(`Liaison users échouée: ${userLinkError.message}`)
    } else {
      success(`Utilisateur lié au tenant`)
    }

    // 5. Créer l'entrée tenant_members (owner)
    const { error: memberError } = await supabase
      .from('tenant_members')
      .upsert({
        tenant_id: tenantId,
        user_id: userId,
        email: userData.email,
        role: 'admin',
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })

    if (memberError) {
      warn(`tenant_members: ${memberError.message}`)
    } else {
      success(`Membre admin créé dans tenant_members`)
    }

    createdUsers.push({ userId, tenantId, name: userData.display_name })
  }

  // ── Créer les posts de démo pour Sarah (la 2ème) ───────────────────────────
  const sarah = createdUsers.find((u) => u.name === 'Sarah El Mansouri')
  if (sarah) {
    console.log('\n── Posts de démonstration pour Sarah ──')
    const posts = getSamplePosts(sarah.tenantId, sarah.userId)

    const { data: insertedPosts, error: postsError } = await supabase
      .from('posts')
      .insert(posts)
      .select('id, title, status')

    if (postsError) {
      warn(`Posts: ${postsError.message}`)
    } else {
      success(`${insertedPosts?.length ?? 0} posts créés`)
      insertedPosts?.forEach((p) => info(`  → [${p.status}] ${p.title}`))
    }
  }

  // ── Créer des posts de démo pour Karim (le 3ème) ──────────────────────────
  const karim = createdUsers.find((u) => u.name === 'Karim Benali')
  if (karim) {
    console.log('\n── Posts de démonstration pour Karim ──')
    const posts = [
      {
        tenant_id: karim.tenantId,
        created_by: karim.userId,
        title: 'Étude de cas — +47% de leads qualifiés',
        content: `📊 Comment une PME industrielle a multiplié ses leads B2B par 1,5 en 60 jours.\n\nLe brief : secteur métallurgie, Casablanca, 45 employés. Zéro présence digitale.\n\nLa méthode :\n1️⃣ Audit positionnement (persona ICP ultra-précis)\n2️⃣ LinkedIn Strategy (3 posts/semaine, format étude de cas)\n3️⃣ Cold outreach (450 directeurs achat ciblés)\n\nRésultat : 67 rendez-vous qualifiés. 12 deals signés. 340k MAD de CA additionnel.\n\nLe digital B2B, ça marche. Avec la bonne méthode.\n\n#B2B #LeadGen #Maroc #PME #LinkedIn`,
        platforms: ['linkedin'],
        status: 'published',
        published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        ai_metadata: { brand_dna_score: 84, provider: 'fal_ai' },
      },
      {
        tenant_id: karim.tenantId,
        created_by: karim.userId,
        title: 'Thread — 7 erreurs marketing PME',
        content: `🧵 7 erreurs marketing que font 90% des PME marocaines (et comment les éviter)\n\n1/ Cibler "tout le monde"\n→ Résultat : personne ne se sent concerné\n→ Fix : 1 ICP ultra-précis avant toute chose\n\n2/ Pas de différenciateur clair\n→ Résultat : concurrence sur le prix uniquement\n→ Fix : USP en 1 phrase, testée sur 10 clients\n\n[... suite en commentaire]`,
        platforms: ['twitter', 'linkedin'],
        status: 'draft',
        ai_metadata: { brand_dna_score: 76, provider: 'together_ai' },
      },
    ]

    const { data: karimPosts, error: karimError } = await supabase
      .from('posts')
      .insert(posts)
      .select('id, title, status')

    if (karimError) {
      warn(`Posts Karim: ${karimError.message}`)
    } else {
      success(`${karimPosts?.length ?? 0} posts créés pour Karim`)
    }
  }

  // ── Résumé final ───────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════')
  console.log('  ✅  Seed terminé avec succès !')
  console.log('════════════════════════════════════════════════════')
  console.log('\n📋 Comptes de test créés :')
  console.log('┌─────────────────────────────────┬────────────────────┬──────────────────┬───────────────┐')
  console.log('│ Nom                             │ Email              │ Mot de passe     │ Plan          │')
  console.log('├─────────────────────────────────┼────────────────────┼──────────────────┼───────────────┤')

  const accounts = [
    ['Amine Mansouri (Admin)',  'amine@ai-mpower.com',    'Admin2026!', 'agency_plus'],
    ['Sarah El Mansouri',       'sarah@agence-casa.ma',   'Test2026!',  'agency'],
    ['Karim Benali',            'karim@consultant.ma',    'Test2026!',  'pro'],
    ['Fatima Zahra Alaoui',     'fatima@coach-ma.com',    'Test2026!',  'solo'],
    ['Youssef Ben Salah',       'youssef@startup.tn',     'Test2026!',  'free'],
  ]

  for (const [name, email, pwd, plan] of accounts) {
    console.log(`│ ${name.padEnd(31)} │ ${email.padEnd(18)} │ ${pwd.padEnd(16)} │ ${plan.padEnd(13)} │`)
  }

  console.log('└─────────────────────────────────┴────────────────────┴──────────────────┴───────────────┘')
  console.log('\n🌐 Accès : http://localhost:3000/login')
  console.log('👑 Console admin : http://localhost:3000/admin\n')
}

seed().catch((err) => {
  console.error('\n❌  Erreur fatale:', err)
  process.exit(1)
})
