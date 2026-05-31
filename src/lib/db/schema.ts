import {
  pgTable,
  uuid,
  text,
  varchar,
  jsonb,
  boolean,
  timestamp,
  integer,
  bigint,
  real,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ============================================================
// ENUMS
// ============================================================

export const planEnum = pgEnum('plan', ['free', 'solo', 'pro', 'agency', 'agency_plus', 'enterprise'])
export const platformEnum = pgEnum('platform', ['twitter', 'linkedin', 'facebook', 'instagram', 'pinterest', 'mastodon', 'youtube', 'tiktok'])
export const postStatusEnum = pgEnum('post_status', ['draft', 'review', 'approved', 'scheduled', 'publishing', 'published', 'failed'])
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'agency_owner', 'brand_manager', 'content_creator', 'viewer'])

// ============================================================
// TENANTS
// ============================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 63 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  owner_id: uuid('owner_id').notNull(),
  plan: planEnum('plan').notNull().default('free'),
  logo_url: text('logo_url'),
  brand_dna: jsonb('brand_dna'),
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }),
  stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }),
  subscription_status: varchar('subscription_status', { length: 50 }),
  generation_count: integer('generation_count').notNull().default(0),
  generation_reset_at: timestamp('generation_reset_at', { withTimezone: true }),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// USERS (sync avec Supabase Auth)
// ============================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // == auth.users.id
  email: varchar('email', { length: 255 }).notNull().unique(),
  full_name: varchar('full_name', { length: 255 }),
  avatar_url: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('content_creator'),
  tenant_id: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  onboarding_completed: boolean('onboarding_completed').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// SOCIAL ACCOUNTS
// ============================================================

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  account_name: varchar('account_name', { length: 255 }).notNull(),
  account_id: varchar('account_id', { length: 255 }).notNull(),
  access_token_encrypted: text('access_token_encrypted').notNull(),
  refresh_token_encrypted: text('refresh_token_encrypted'),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  scopes: text('scopes').array().notNull().default([]),
  is_active: boolean('is_active').notNull().default(true),
  last_error: text('last_error'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// POSTS
// ============================================================

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 500 }),
  content: text('content').notNull(),
  media_urls: text('media_urls').array().default([]),
  platforms: platformEnum('platforms').array().notNull().default([]),
  status: postStatusEnum('status').notNull().default('draft'),
  scheduled_at: timestamp('scheduled_at', { withTimezone: true }),
  published_at: timestamp('published_at', { withTimezone: true }),
  brand_dna_snapshot: jsonb('brand_dna_snapshot'),
  ai_metadata: jsonb('ai_metadata'),
  platform_results: jsonb('platform_results'), // { twitter: { post_id, url }, ... }
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// MEDIA (assets stockés MinIO/R2)
// ============================================================

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  uploaded_by: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  filename: varchar('filename', { length: 500 }).notNull(),
  mime_type: varchar('mime_type', { length: 100 }).notNull(),
  size_bytes: integer('size_bytes').notNull(),
  storage_path: text('storage_path').notNull(), // chemin MinIO/R2
  public_url: text('public_url'),
  alt_text: text('alt_text'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// POST METRICS (engagement réel — Performance Loop, MOAT-1)
// ============================================================

export const postMetrics = pgTable('post_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  post_id: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  collected_at: timestamp('collected_at', { withTimezone: true }).defaultNow().notNull(),
  impressions: integer('impressions').default(0),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  clicks: integer('clicks').default(0),
  saves: integer('saves').default(0),
  engagement_rate: real('engagement_rate').default(0), // (likes+comments+shares+saves)/impressions
  raw: jsonb('raw'), // réponse brute normalisée de l'API plateforme
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type PostMetric = typeof postMetrics.$inferSelect
export type NewPostMetric = typeof postMetrics.$inferInsert

// ============================================================
// ATTRIBUTION RANKINGS (cache feature→performance — US-007)
// ============================================================

export const attributionRankings = pgTable('attribution_rankings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  dimension: varchar('dimension', { length: 50 }).notNull(), // cognitive_objective | dominant_color_hex | visual_direction | hook | format | scheduled_hour | platform
  value: text('value').notNull(),
  avg_engagement: real('avg_engagement').notNull().default(0),
  total_impressions: bigint('total_impressions', { mode: 'number' }).notNull().default(0),
  sample_size: integer('sample_size').notNull().default(0),
  computed_at: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
})

export type AttributionRanking = typeof attributionRankings.$inferSelect
export type NewAttributionRanking = typeof attributionRankings.$inferInsert

// ============================================================
// AUDIT LOG
// ============================================================

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resource_type: varchar('resource_type', { length: 100 }),
  resource_id: uuid('resource_id'),
  metadata: jsonb('metadata'),
  ip_address: varchar('ip_address', { length: 45 }),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// TRANSCRIPTIONS
// ============================================================

export const transcriptionStatusEnum = pgEnum('transcription_status', ['uploading', 'processing', 'completed', 'failed'])

export const transcriptions = pgTable('transcriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  original_filename: varchar('original_filename', { length: 500 }).notNull(),
  storage_path: text('storage_path').notNull(),
  mime_type: varchar('mime_type', { length: 100 }).notNull(),
  file_size_bytes: integer('file_size_bytes').notNull(),
  duration_seconds: integer('duration_seconds'),
  language: varchar('language', { length: 10 }).notNull().default('fr'),
  status: transcriptionStatusEnum('status').notNull().default('uploading'),
  transcript_text: text('transcript_text'),
  speakers: jsonb('speakers'), // [{ speaker: "Intervenant 1", segments: [{ start: 0, end: 30, text: "..." }] }]
  verbatims: jsonb('verbatims'), // [{ quote: "...", speaker: "...", timestamp: "04:32", importance: "high" }]
  ai_summary: text('ai_summary'),
  ai_actions: jsonb('ai_actions'), // [{ action: "...", assignee: "...", deadline: "..." }]
  error_message: text('error_message'),
  created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// CRM — ENUMS
// ============================================================

export const leadStageEnum = pgEnum('lead_stage', ['lead', 'contacted', 'proposal', 'signed'])
export const leadActivityTypeEnum = pgEnum('lead_activity_type', ['call', 'email', 'meeting', 'note'])

// ============================================================
// CRM — LEADS
// ============================================================

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  company_name: varchar('company_name', { length: 255 }).notNull(),
  contact_name: varchar('contact_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  linkedin_url: text('linkedin_url'),
  sector: varchar('sector', { length: 100 }),
  company_size: varchar('company_size', { length: 50 }),
  location: varchar('location', { length: 255 }),
  stage: leadStageEnum('stage').notNull().default('lead'),
  deal_value: integer('deal_value').default(0),
  currency: varchar('currency', { length: 3 }).notNull().default('MAD'),
  score: integer('score').default(0),
  brand_dna_match: jsonb('brand_dna_match'),
  apollo_data: jsonb('apollo_data'),
  next_followup_at: timestamp('next_followup_at', { withTimezone: true }),
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// CRM — LEAD ACTIVITIES
// ============================================================

export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  lead_id: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: leadActivityTypeEnum('type').notNull(),
  content: text('content').notNull(),
  created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================
// ENUMS — DOCUMENTS
// ============================================================

export const documentTypeEnum = pgEnum('document_type', ['offre_commerciale', 'rapport_client', 'presentation'])
export const documentStatusEnum = pgEnum('document_status', ['draft', 'in_progress', 'completed'])

// ============================================================
// DOCUMENTS
// ============================================================

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  type: documentTypeEnum('type').notNull(),
  client_name: varchar('client_name', { length: 255 }),
  status: documentStatusEnum('status').notNull().default('draft'),
  storage_path: text('storage_path'),
  public_url: text('public_url'),
  content_json: jsonb('content_json'),
  brand_dna_snapshot: jsonb('brand_dna_snapshot'),
  file_size_bytes: integer('file_size_bytes'),
  created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
