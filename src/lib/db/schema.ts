import {
  pgTable,
  uuid,
  text,
  varchar,
  jsonb,
  boolean,
  timestamp,
  integer,
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
