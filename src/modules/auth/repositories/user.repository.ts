import { eq } from 'drizzle-orm';
import { db } from '../../../database';
import { users } from '../../../database/schema/users';

export type CreateUserInput = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;

export class UserRepository {
  async create(data: CreateUserInput): Promise<UserSelect> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async findByEmail(email: string): Promise<UserSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  async findById(id: string): Promise<UserSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }
}
