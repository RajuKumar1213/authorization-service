import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema/index.js';
import { logger } from '../core/logger';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err: Error) => {
  logger.error(err, 'Unexpected error on idle client');
  process.exit(-1);
});

export const db = drizzle(pool, { schema });
