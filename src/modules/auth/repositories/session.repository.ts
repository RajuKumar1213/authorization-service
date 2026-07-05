import { eq } from 'drizzle-orm';
import { db } from '../../../database';
import { sessions } from '../../../database/schema/sessions';
import { redis } from '../../../database/redis';

export type CreateSessionInput = typeof sessions.$inferInsert;
export type SessionSelect = typeof sessions.$inferSelect;

const SESSION_PREFIX = 'session:';

export class SessionRepository {
  async create(data: CreateSessionInput): Promise<SessionSelect> {
    const [session] = await db.insert(sessions).values(data).returning();
    
    // Cache session in Redis
    const ttlSeconds = Math.floor((data.expiresAt.getTime() - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await redis.set(`${SESSION_PREFIX}${session.id}`, JSON.stringify(session), 'EX', ttlSeconds);
    }

    return session;
  }

  async findById(id: string): Promise<SessionSelect | null> {
    // Check Redis first
    const cached = await redis.get(`${SESSION_PREFIX}${id}`);
    if (cached) {
      return JSON.parse(cached) as SessionSelect;
    }

    // Fallback to Postgres
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    
    if (session) {
      const ttlSeconds = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
      if (ttlSeconds > 0 && !session.isRevoked) {
        await redis.set(`${SESSION_PREFIX}${session.id}`, JSON.stringify(session), 'EX', ttlSeconds);
      }
    }

    return session || null;
  }

  async revoke(id: string): Promise<void> {
    await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.id, id));
    await redis.del(`${SESSION_PREFIX}${id}`);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const userSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
    await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId));
    
    const pipeline = redis.pipeline();
    for (const session of userSessions) {
      pipeline.del(`${SESSION_PREFIX}${session.id}`);
    }
    await pipeline.exec();
  }
}
