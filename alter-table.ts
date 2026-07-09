import { db } from './src/database/index';
import { sql } from 'drizzle-orm';

async function alterTable() {
  try {
    await db.execute(sql`ALTER TABLE "permissions" ADD COLUMN "icon_url" varchar(1024);`);
    console.log('Successfully altered permissions table.');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('Column already exists.');
    } else {
      console.error('Error:', error);
    }
  }
  process.exit(0);
}

alterTable();
