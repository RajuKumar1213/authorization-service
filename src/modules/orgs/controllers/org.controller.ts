import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organization.service';

export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = (req as any).user.userId;
      const { name, slug } = req.body;
      const org = await this.orgService.createOrganization(ownerId, name, slug);
      res.status(201).json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  };

  listMyOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const orgs = await this.orgService.getUserOrganizations(userId);
      res.status(200).json({ success: true, data: orgs });
    } catch (error) {
      next(error);
    }
  };

  // Other endpoints like addMember, removeMember, etc. would go here
}
