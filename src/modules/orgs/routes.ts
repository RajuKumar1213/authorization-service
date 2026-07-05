import { Router } from 'express';
import { OrganizationController } from './controllers/org.controller';
import { OrganizationService } from './services/organization.service';
import { OrganizationRepository } from './repositories/organization.repository';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireTenant } from '../../middlewares/tenant.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

const router = Router();
const orgRepo = new OrganizationRepository();
const orgService = new OrganizationService(orgRepo);
const orgController = new OrganizationController(orgService);

// Global org endpoints
router.post('/', requireAuth, orgController.create);
router.get('/me', requireAuth, orgController.listMyOrganizations);

// Tenant-specific endpoints (Requires x-tenant-id header)
// router.post('/members', requireAuth, requireTenant, requirePermission('write', 'members'), orgController.addMember);

export default router;
