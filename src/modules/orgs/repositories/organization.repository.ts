import { eq, and } from 'drizzle-orm';
import { db } from '../../../database/index.js';
import { organizations, organizationMembers } from '../../../database/schema/organizations.js';

export type CreateOrgInput = typeof organizations.$inferInsert;

export class OrganizationRepository {
  async create(data: CreateOrgInput) {
    return db.transaction(async (tx: any) => {
      const [org] = await tx.insert(organizations).values(data).returning();
      
      await tx.insert(organizationMembers).values({
        organizationId: org.id,
        userId: data.ownerId,
      });

      return org;
    });
  }

  async findById(id: string) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return org || null;
  }

  async isMember(organizationId: string, userId: string) {
    const [member] = await db.select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId)
        )
      )
      .limit(1);
    
    return !!member;
  }

  async getUserOrganizations(userId: string) {
    return db.select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      joinedAt: organizationMembers.joinedAt,
    })
    .from(organizations)
    .innerJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId));
  }
}
