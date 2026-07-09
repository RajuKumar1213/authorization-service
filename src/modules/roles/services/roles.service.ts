import { RoleRepository } from '../repositories/role.repository';
import { db } from '../../../database';
import { roles, permissions } from '../../../database/schema/roles';

export class RolesService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async createRole(data: { name: string; description?: string }) {
    return await this.roleRepository.createRole(data);
  }

  async getAllRoles() {
    return await db.select().from(roles);
  }

  async createPermission(data: { action: string; resource: string; description?: string; iconUrl?: string }) {
    return await this.roleRepository.createPermission(data);
  }

  async getAllPermissions() {
    return await db.select().from(permissions);
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    await this.roleRepository.assignPermissionToRole(roleId, permissionId);
  }

  async assignRoleToUser(userId: string, roleId: string) {
    await this.roleRepository.assignRoleToUser(userId, roleId);
  }
}
