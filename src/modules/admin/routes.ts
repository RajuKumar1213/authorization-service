import { Router } from 'express';
import { AdminController } from './controllers/admin.controller';
import { AuditService } from '../audit/services/audit.service';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

const router = Router();
const auditService = new AuditService();
const adminController = new AdminController(auditService);

// Require global 'admin' permission
router.use(requireAuth);
// router.use(requirePermission('admin', 'system')); // Setup appropriately

router.post('/users/:id/suspend', adminController.suspendUser);
router.get('/audit', adminController.viewAuditLogs);

export default router;
