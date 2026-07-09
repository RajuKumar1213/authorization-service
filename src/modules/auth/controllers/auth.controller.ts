import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { env } from '../../../config/env.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await this.authService.login({
        email,
        password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        device: 'web', // Can be parsed from user-agent or sent by client
      });

      // Set refresh token in httpOnly cookie
      const expiresInMs = require('ms')(env.REFRESH_TOKEN_EXPIRES_IN) as number;
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: expiresInMs,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ success: false, error: { message: 'Refresh token missing' } });
        return;
      }

      // SessionId is embedded in accessToken payload, but for refresh only flow, 
      // we usually decode an expired access token to get the sessionId, 
      // or simply we can find the session from the refresh token hash if we store it differently.
      // Wait, in our authService we expect sessionId and refreshToken.
      // To get sessionId, we can decode the access token from the Authorization header (even if expired).
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: { message: 'Access token missing' } });
        return;
      }

      const token = authHeader.split(' ')[1];
      const jwt = require('jsonwebtoken');
      let payload: any;
      try {
        payload = jwt.verify(token, env.JWT_SECRET, { ignoreExpiration: true });
      } catch (err) {
        res.status(401).json({ success: false, error: { message: 'Invalid access token format' } });
        return;
      }

      const { accessToken } = await this.authService.refresh(payload.sessionId, refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = (req as any).user?.sessionId;
      if (sessionId) {
        await this.authService.logout(sessionId);
      }
      res.clearCookie('refreshToken');
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const user = await this.authService.getMe(userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  };

  setupMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const email = 'user@example.com'; // In reality fetch user from DB
      const { MfaService } = await import('../services/mfa.service.js');
      const mfaService = new MfaService();
      const data = await mfaService.generateTotpSecret(userId, email);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  verifyMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { token } = req.body;
      const { MfaService } = await import('../services/mfa.service.js');
      const mfaService = new MfaService();
      const data = await mfaService.verifyAndEnableTotp(userId, token);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  disableMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { token } = req.body;
      const { MfaService } = await import('../services/mfa.service.js');
      const mfaService = new MfaService();
      await mfaService.disableMfa(userId, token);
      res.status(200).json({ success: true, message: 'MFA disabled' });
    } catch (error) {
      next(error);
    }
  };
}
