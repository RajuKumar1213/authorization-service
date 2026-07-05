import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface TokenPayload {
  userId: string;
  sessionId: string;
  roles?: string[];
  permissions?: string[];
}

export class JwtUtil {
  static signToken(payload: TokenPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as any });
  }

  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  }
}
