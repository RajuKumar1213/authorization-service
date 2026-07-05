import { db } from '../../../database';
import { roles, permissions, rolePermissions, userRoles } from '../../../database/schema/roles';
import { eq, and } from 'drizzle-orm';

export class RoleRepository {
  async createRole(data: { name: string; description?: string; organizationId?: string }) {
    const [role] = await db.insert(roles).values(data).returning();
    return role;
  }

  async createPermission(data: { action: string; resource: string; description?: string }) {
    const [permission] = await db.insert(permissions).values(data).returning();
    return permission;
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    await db.insert(rolePermissions).values({ roleId, permissionId });
  }

  async assignRoleToUser(userId: string, roleId: string, organizationId?: string) {
    await db.insert(userRoles).values({ userId, roleId, organizationId });
  }

  async getUserRoles(userId: string, organizationId?: string) {
    const query = db.select({
      id: roles.id,
      name: roles.name,
      organizationId: roles.organizationId,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        organizationId ? eq(userRoles.organizationId, organizationId) : undefined
      )
    );

    return query;
  }
}
