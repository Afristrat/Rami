import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '.env.local' })

export default {
  schema: './src/lib/db/schema.ts',
  out: './database/migrations',
  connectionString: process.env.SUPABASE_DB_URL!,
} satisfies Config
