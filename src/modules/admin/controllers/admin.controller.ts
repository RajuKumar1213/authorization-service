import { Request, Response, NextFunction } from 'express';
import { db } from '../../../database';
import { users } from '../../../database/schema/users';
import { eq } from 'drizzle-orm';
import { AuditService } from '../../audit/services/audit.service';
import { NotFoundError } from '../../../core/errors';

export class AdminController {
  constructor(private readonly auditService: AuditService) {}

  suspendUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await db.update(users).set({ isSuspended: true, isActive: false }).where(eq(users.id, id));

      await this.auditService.log({
        actorId: (req as any).user.userId,
        action: 'user:suspend',
        targetResource: 'users',
        targetId: id,
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.status(200).json({ success: true, message: 'User suspended successfully' });
    } catch (error) {
      next(error);
    }
  };

  viewAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const logs = await this.auditService.getLogs(page, limit);
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  };
}
