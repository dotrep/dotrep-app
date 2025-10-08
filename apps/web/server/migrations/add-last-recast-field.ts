import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function addLastRecastField() {
  try {
    // Add last_recast column to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_recast TIMESTAMP NULL;
    `);

    console.log('✅ Successfully added last_recast field to users table');
    return { success: true, message: 'Last recast field added successfully' };
  } catch (error) {
    console.error('❌ Failed to add last_recast field:', error);
    return { success: false, message: `Migration failed: ${error}` };
  }
}