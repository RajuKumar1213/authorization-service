import { Request, Response, NextFunction } from 'express';
import { RolesService } from '../services/roles.service';

export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      const role = await this.rolesService.createRole({ name, description });
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  };

  getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await this.rolesService.getAllRoles();
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  };

  createPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, resource, description } = req.body;
      const iconUrl = req.file ? (req.file as any).path : undefined;

      const permission = await this.rolesService.createPermission({ action, resource, description, iconUrl });
      res.status(201).json({ success: true, data: permission });
    } catch (error) {
      next(error);
    }
  };

  getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permissions = await this.rolesService.getAllPermissions();
      res.status(200).json({ success: true, data: permissions });
    } catch (error) {
      next(error);
    }
  };

  assignPermissionToRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;
      const permissionId = req.params.permissionId as string;
      await this.rolesService.assignPermissionToRole(roleId, permissionId);
      res.status(200).json({ success: true, message: 'Permission assigned to role successfully' });
    } catch (error) {
      next(error);
    }
  };

  assignRoleToUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const roleId = req.params.roleId as string;
      await this.rolesService.assignRoleToUser(userId, roleId);
      res.status(200).json({ success: true, message: 'Role assigned to user successfully' });
    } catch (error) {
      next(error);
    }
  };
}
