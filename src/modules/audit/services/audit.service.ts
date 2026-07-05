import { db } from '../../../database';
import { auditLogs } from '../../../database/schema/audit';

export interface AuditLogInput {
  actorId?: string;
  action: string;
  targetResource?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  status: 'SUCCESS' | 'FAILURE';
  reason?: string;
}

export class AuditService {
  async log(data: AuditLogInput) {
    // Fire and forget, don't wait for it unless necessary
    db.insert(auditLogs).values(data).catch((err: Error) => {
      const { logger } = require('../../../core/logger');
      logger.error(err, 'Failed to insert audit log');
    });
  }

  async getLogs(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return db.select().from(auditLogs).limit(limit).offset(offset);
  }
}
