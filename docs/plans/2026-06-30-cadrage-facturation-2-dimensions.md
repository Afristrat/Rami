# Cadrage — Module Facturation RAMI (2 dimensions)

> **Statut** : cadrage à valider (arbitrages produit en fin de doc).
> **Date** : 2026-06-30.
> **Décision Amine** : RAMI couvre **les deux dimensions, séparées** :
> - **A — Abonnement RAMI** : ce que les tenants paient à AI-MPower pour utiliser RAMI (Stripe).
> - **B — Facturation tenant→clients** : ce que les tenants facturent à LEURS clients (remplace Zoho Invoice).

---

## 0. État réel (preuve système)

| | Dimension A (abonnement RAMI) | Dimension B (tenant→clients) |
|---|---|---|
| Code | ✅ **Réel** — `/billing`, Stripe Checkout + Customer Portal + webhooks, factures Stripe live | ❌ **Inexistant** |
| Données | colonnes `tenants.stripe_*` | aucune table métier |
| PDF | facture Stripe hébergée | aucun |
| Vestiges trompeurs | — | table SQL `invoices` **morte** (jamais lue/écrite) ; flag `billing_module` **mort** (défini, jamais gardé) |

⚠️ **Dette d'honnêteté à traiter en priorité** : les plans Agency (399 $) et Agency+ (699 $) **vendent « Module facturation clients »** (`plans.ts:180`) alors que la fonctionnalité **n'existe pas**. Tant que B n'est pas livré → soit retirer la mention de l'offre, soit la marquer « à venir ». (Décision Amine : on construit B juste après les plateformes → on peut garder la mention en la marquant « bientôt » le temps du chantier.)

---

## DIMENSION A — Abonnement RAMI (déjà réel)

Rien à construire ; **assainir** uniquement :
1. Supprimer la **table `invoices` morte** (migration `20260311000005_billing.sql`) — jamais utilisée (les factures sont lues en direct via l'API Stripe).
2. Décider du sort du flag `billing_module` (voir Dimension B — c'est lui qui gardera B).
3. Garder `/billing` comme **espace abonnement** (paiement, plan, factures Stripe). **Ne jamais y mélanger la facturation client.**

---

## DIMENSION B — Facturation tenant→clients (le chantier)

Espace **distinct** : `/invoices` (ou `/clients/billing`). Permet à une agence/consultant de créer, envoyer et suivre les factures destinées à SES clients.

### B.1 Contraintes légales Maroc (factuel — à respecter by design)

D'après l'**article 145 du CGI** (mentions obligatoires) et la réforme TVA (Lois de Finances 2024→2026) :
- **Numérotation séquentielle continue, sans trou**, par entité émettrice → contrainte technique forte (séquence atomique par tenant, pas de suppression qui casse la suite : on **annule**, on ne supprime pas).
- **ICE (15 chiffres) obligatoire** pour l'émetteur **et** le client (B2B).
- Identification complète émetteur + client (raison sociale, adresse fiscale, IF/RC selon le cas).
- **TVA ventilée par taux** + montant + **total TTC** + mode de paiement.
- **Taux TVA en vigueur (depuis 01/01/2026)** : **normal 20 %** (majorité des prestations de services, dont marketing/conseil) et **réduit 10 %** ; les anciens **7 % et 14 % sont supprimés**. → Taux **configurable** par ligne, défaut **20 %** pour une agence/consultant.
- Cas **exonéré** (auto-entrepreneur) : mention « TVA non applicable — Auto-entrepreneur exonéré ».
- ⚠️ **Facturation électronique obligatoire en 2026** (art. 145-IX) : système de facturation conforme aux critères techniques de la DGI. **Le décret d'application et le calendrier exact restent à confirmer** → concevoir le module pour être *e-invoicing ready* (numérotation fiable, format structuré exportable, archivage), sans présumer du format DGI tant qu'il n'est pas publié.

> Tout ce qui touche taux/mentions/échéances doit être **paramétrable** et **vérifié à la source** au moment de l'implémentation — ne pas figer une règle fiscale en dur.

### B.2 Modèle de données (proposition)
- `clients` (les clients DU tenant) : tenant_id, raison_sociale, ICE, IF, adresse, email, devise par défaut, contact.
- `invoices` (la vraie, pas la morte) : tenant_id, client_id, **numero** (séquentiel par tenant), statut, date_emission, date_echeance, devise, sous_total, tva_total, total_ttc, notes, conditions, pdf_url.
- `invoice_items` : invoice_id, description, quantite, prix_unitaire, taux_tva, montant_ht.
- `invoice_sequences` : tenant_id, annee, dernier_numero (allocation atomique du numéro, anti-trou).
- `payments` : invoice_id, montant, date, methode, reference (suivi des règlements, total/partiel).
- **RLS tenant** sur toutes (pattern `users.tenant_id` ∪ `tenant_members`, comme `media_assets`).

### B.3 Fonctionnalités
- **Création** de facture (sélection client, lignes, TVA par ligne, remises éventuelles) avec calculs automatiques HT/TVA/TTC.
- **Numérotation légale** atomique (séquence par tenant, format configurable ex. `2026-0001`).
- **Multi-devises** MAD / EUR / USD (cf. marché Maroc-first puis international).
- **PDF brandé** : réutiliser l'infra du **Document Engine** existant (`src/lib/services/documents/`, déjà PDF via @react-pdf) en ajoutant un type `facture` + template conforme art. 145.
- **Envoi email** au client via **Resend** (PDF en pièce jointe + lien).
- **Suivi de paiement** : statuts (brouillon → envoyée → payée / partiellement payée / en retard / annulée), relances.
- (Option) **Encaissement en ligne** via Stripe (lien de paiement sur la facture) — distinct de l'abonnement RAMI.
- **Export** comptable (CSV/PDF) + archivage (rétention légale).

### B.4 Gating & cohérence offre
- Appliquer **enfin** le flag `billing_module` comme garde réelle (`requireFeature("billing_module")`) sur `/invoices` → réservé **Agency / Agency+** (comme annoncé dans les plans). Cela **résout la dette d'honnêteté** une fois B livré.

### B.5 UI
- Nouvel espace `/invoices` : liste filtrable (statut, client, période), création/édition, aperçu PDF, actions (envoyer, marquer payée, relancer, annuler).
- Sous-section `clients` (carnet d'adresses des clients du tenant).
- **Aucune** fusion avec `/billing` (abonnement) — séparation stricte.

---

## Arbitrages à valider (Amine)

1. **Encaissement en ligne** (B.3) : on inclut le paiement Stripe sur facture dès la v1, ou facture + suivi manuel d'abord et encaissement plus tard ?
2. **Carnet clients** : module `clients` autonome (réutilisable par le CRM/lead-gen), ou minimal embarqué dans la facturation ?
3. **e-invoicing DGI** : on conçoit *ready* (export structuré + archivage) sans implémenter le format DGI tant que le décret n'est pas publié — OK ? (sinon risque de coder un format qui changera).
4. **Devises** : taux de change figé à la saisie (facture en devise du client) — pas de conversion automatique temps réel en v1 ?
5. **Numéro de facture** : format souhaité (`2026-0001`, `FAC-2026-0001`, préfixe par marque… ?) et remise à zéro annuelle ou continue ?
6. **Dette offre** : pendant la construction de B, on marque « Module facturation clients » comme « bientôt » dans les plans, ou on le retire temporairement ?

## Découpage indicatif en stories
- B-0 assainissement (drop table `invoices` morte, statut offre) ·
- B-1 schéma DB + RLS + séquence atomique · B-2 carnet `clients` · B-3 CRUD facture + calculs TVA · B-4 PDF conforme art.145 (Document Engine) · B-5 envoi Resend · B-6 suivi paiement + statuts · B-7 gating `billing_module` · B-8 (option) encaissement Stripe · B-9 export/archivage e-invoicing-ready.

---

### Sources (volet fiscal Maroc)
- Mentions obligatoires — art. 145 CGI : Fatoura Plus, ClicPaie, Fawatir (checklist DGI).
- Réforme TVA 2024-2026 (taux 20 % / 10 %, suppression 7 %/14 %) : Upsilon Consulting, ClicPaie.
- Facturation électronique 2026 (art. 145-IX) : Upsilon Consulting, Experio, Hunter BI.
> ⚠️ Données à **re-vérifier à la source officielle DGI** au moment de l'implémentation (décret d'application e-invoicing, calendrier).
