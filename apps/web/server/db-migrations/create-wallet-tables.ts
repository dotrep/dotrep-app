/**
 * Migration script to create wallet-related tables
 */
import { db } from '../db';
import * as schema from '../../shared/schema';
import { sql } from 'drizzle-orm';

export async function createWalletTables() {
  try {
    console.log('Starting wallet tables migration...');
    
    // Create crypto_type enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crypto_type') THEN
          CREATE TYPE crypto_type AS ENUM ('bitcoin', 'ethereum', 'litecoin', 'dogecoin');
        END IF;
      END
      $$;
    `);
    
    // Create wallet_addresses table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wallet_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        fsn_name VARCHAR(50) NOT NULL,
        crypto_type crypto_type NOT NULL,
        address TEXT NOT NULL,
        public_key TEXT,
        encrypted_private_key TEXT,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create wallet_transactions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        wallet_address_id INTEGER REFERENCES wallet_addresses(id),
        transaction_hash TEXT NOT NULL,
        crypto_type crypto_type NOT NULL,
        amount TEXT NOT NULL,
        fee_amount TEXT,
        is_incoming BOOLEAN NOT NULL,
        status TEXT NOT NULL,
        from_address TEXT,
        to_address TEXT,
        memo TEXT,
        block_height INTEGER,
        block_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Wallet tables migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error in wallet tables migration:', error);
    return false;
  }
}