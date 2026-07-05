import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../shared/utils/jwt';
import { UnauthorizedError } from '../core/errors';
import { SessionRepository } from '../modules/auth/repositories/session.repository';
import dayjs from 'dayjs';

const sessionRepository = new SessionRepository();

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = JwtUtil.verifyToken(token);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Verify session in Redis/Postgres
    const session = await sessionRepository.findById(payload.sessionId);
    if (!session || session.isRevoked || dayjs().isAfter(session.expiresAt)) {
      throw new UnauthorizedError('Session expired or revoked', 'SESSION_INVALID');
    }

    // Attach user payload to request
    (req as any).user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
