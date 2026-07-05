import { Router } from 'express';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserRepository } from './repositories/user.repository';
import { SessionRepository } from './repositories/session.repository';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { registerSchema, loginSchema, refreshSchema } from './validators';

const router = Router();

const userRepository = new UserRepository();
const sessionRepository = new SessionRepository();
const authService = new AuthService(userRepository, sessionRepository);
const authController = new AuthController(authService);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: { user: (req as any).user } });
});

router.post('/mfa/setup', requireAuth, authController.setupMfa);
router.post('/mfa/verify', requireAuth, authController.verifyMfa);
router.post('/mfa/disable', requireAuth, authController.disableMfa);

export default router;
