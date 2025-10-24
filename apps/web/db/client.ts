import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// Export pool so it can be shared with session store
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
})

export const db = drizzle(pool)

export async function closeDb() {
  await pool.end()
}
