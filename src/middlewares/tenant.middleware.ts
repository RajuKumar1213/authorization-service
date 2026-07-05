import { Request, Response, NextFunction } from 'express';
import { BadRequestError, ForbiddenError } from '../core/errors';
import { OrganizationRepository } from '../modules/orgs/repositories/organization.repository';

const orgRepo = new OrganizationRepository();

export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new BadRequestError('x-tenant-id header is required');
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      throw new ForbiddenError('User not authenticated');
    }

    const isMember = await orgRepo.isMember(tenantId, userId);
    if (!isMember) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    (req as any).tenantId = tenantId;
    next();
  } catch (error) {
    next(error);
  }
};
