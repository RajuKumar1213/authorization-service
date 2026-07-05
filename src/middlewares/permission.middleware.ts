import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../core/errors';
import { db } from '../database';
import { userRoles, rolePermissions, permissions } from '../database/schema/roles';
import { eq, and } from 'drizzle-orm';

export const requirePermission = (requiredAction: string, requiredResource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      const tenantId = (req as any).tenantId;

      if (!userId) {
        throw new ForbiddenError('User not authenticated');
      }

      // Query to check if user has the permission either globally or in the tenant
      const userPermissions = await db
        .select({ action: permissions.action, resource: permissions.resource })
        .from(userRoles)
        .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(userRoles.userId, userId),
            // Either global role (organizationId is null) or specific to this tenant
            tenantId ? eq(userRoles.organizationId, tenantId) : undefined
          )
        );

      const hasPermission = userPermissions.some(
        (p: any) => p.action === requiredAction && p.resource === requiredResource
      );

      if (!hasPermission) {
        throw new ForbiddenError(`Missing required permission: ${requiredAction} on ${requiredResource}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
