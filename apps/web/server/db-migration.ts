/**
 * Database Migration Script
 * 
 * This script fixes the quest_data column issue in the user_stats table
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Runs missing column migration to ensure the database schema matches our code
 */
export async function runMigration() {
  try {
    console.log('Running database migration to add missing columns...');

    // Check if quest_data column exists
    const checkColumnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_stats' AND column_name = 'quest_data'
    `);
    
    // If column doesn't exist, add it
    if (!checkColumnResult.rows.length) {
      console.log('Adding missing quest_data column to user_stats table...');
      await db.execute(sql`
        ALTER TABLE user_stats 
        ADD COLUMN quest_data TEXT
      `);
      console.log('Migration completed successfully: Added quest_data column');
    } else {
      console.log('quest_data column already exists, no migration needed');
    }
    
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
}

// Export for direct execution if needed
export default runMigration;