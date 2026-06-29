// ============================================================
// US-052 — Table `visuals` (API publique v1 de génération visuelle)
// Vérifie que la table Drizzle est déclarée avec les colonnes clés du
// contrat (spec §5) : session + manifeste + QA + slides MinIO.
// ============================================================

import { visuals } from '@/lib/db/schema'

describe('table visuals (schema Drizzle)', () => {
  it('déclare les colonnes clés du contrat API v1', () => {
    const cols = Object.keys(visuals)
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'tenant_id',
        'created_by',
        'type',
        'format',
        'status',
        'manifest',
        'qa',
        'slides',
        'content',
        'brand_dna_snapshot',
        'created_at',
        'updated_at',
      ])
    )
  })
})
