import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.SUPABASE_DB_URL!

// Pour les migrations (max 1 connexion)
export const migrationClient = postgres(connectionString, { max: 1 })

// Pour les requêtes (pool)
const queryClient = postgres(connectionString)
export const db = drizzle(queryClient, { schema })
