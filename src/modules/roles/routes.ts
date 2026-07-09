import { Router } from 'express';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { RoleRepository } from './repositories/role.repository';
import { upload } from '../../shared/services/upload.service';

const router = Router();
const roleRepository = new RoleRepository();
const rolesService = new RolesService(roleRepository);
const rolesController = new RolesController(rolesService);

router.post('/', rolesController.createRole);
router.get('/', rolesController.getAllRoles);

router.post('/permissions', upload.single('icon'), rolesController.createPermission);
router.get('/permissions', rolesController.getAllPermissions);

router.post('/:roleId/permissions/:permissionId', rolesController.assignPermissionToRole);
router.post('/users/:userId/roles/:roleId', rolesController.assignRoleToUser);

export default router;
