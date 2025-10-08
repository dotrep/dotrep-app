/**
 * Script to run all database migrations
 */
import { createWalletTables } from './db-migrations/create-wallet-tables';

async function runAllMigrations() {
  console.log('Starting all migrations...');
  
  try {
    // Run wallet tables migration
    const walletTablesResult = await createWalletTables();
    console.log('Wallet tables migration result:', walletTablesResult ? 'Success' : 'Failed');
    
    // Add more migrations here as needed
    
    console.log('All migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

// Run migrations if this script is executed directly
// Using import.meta.url instead of require.main for ES modules
if (import.meta.url.endsWith('run-migrations.ts')) {
  runAllMigrations().then(() => {
    console.log('Migration script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

export default runAllMigrations;