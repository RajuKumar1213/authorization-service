import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index';
import { logger } from '../core/logger';
import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    await migrate(db, { migrationsFolder: './src/database/migrations' });
    logger.info('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Failed to run database migrations');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
