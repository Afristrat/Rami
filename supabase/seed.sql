-- ============================================================
-- Seed de développement — RAMI Scheduler
-- NE PAS exécuter en production
-- ============================================================

-- Données de test insérées uniquement si la table est vide
DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID := '00000000-0000-0000-0000-000000000001'; -- ID test local
BEGIN
  -- Vérifier si un tenant de test existe déjà
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'test-agency-local' LIMIT 1;

  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (id, slug, name, owner_id, plan)
    VALUES (
      gen_random_uuid(),
      'test-agency-local',
      'Test Agency (local)',
      v_user_id,
      'pro'
    )
    RETURNING id INTO v_tenant_id;
  END IF;

  -- Posts de démonstration si la table posts est vide pour ce tenant
  IF NOT EXISTS (SELECT 1 FROM posts WHERE tenant_id = v_tenant_id LIMIT 1) THEN
    INSERT INTO posts (tenant_id, created_by, title, content, platforms, status, scheduled_at)
    VALUES
      (
        v_tenant_id, v_user_id,
        'Lancement produit',
        'Nous sommes ravis d''annoncer le lancement de notre nouvelle fonctionnalité ! #RAMI #AgencyOS',
        ARRAY['linkedin', 'twitter']::platform[],
        'scheduled',
        now() + interval '2 days'
      ),
      (
        v_tenant_id, v_user_id,
        'Étude de cas client',
        'Découvrez comment notre client a multiplié son engagement par 3 en 30 jours grâce à RAMI.',
        ARRAY['linkedin']::platform[],
        'approved',
        now() + interval '5 days'
      ),
      (
        v_tenant_id, v_user_id,
        NULL,
        'Post Instagram inspirant — Brand DNA Marocain 🌿',
        ARRAY['instagram']::platform[],
        'draft',
        NULL
      ),
      (
        v_tenant_id, v_user_id,
        'Conseil du mois',
        '5 raisons pour lesquelles votre Brand DNA détermine votre ROI social media. Thread 🧵',
        ARRAY['twitter', 'linkedin', 'facebook']::platform[],
        'scheduled',
        now() + interval '10 days'
      );
  END IF;
END $$;
