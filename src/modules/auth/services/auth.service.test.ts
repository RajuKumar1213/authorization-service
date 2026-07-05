import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { AuthService } from './auth.service';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { BadRequestError, UnauthorizedError } from '../../../core/errors';
import { CryptoUtil } from '../../../shared/utils/crypto';

vi.mock('../repositories/user.repository');
vi.mock('../repositories/session.repository');
vi.mock('../../../shared/utils/crypto');
vi.mock('../../../shared/utils/jwt');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: Mocked<UserRepository>;
  let mockSessionRepo: Mocked<SessionRepository>;

  beforeEach(() => {
    mockUserRepo = new UserRepository() as Mocked<UserRepository>;
    mockSessionRepo = new SessionRepository() as Mocked<SessionRepository>;
    authService = new AuthService(mockUserRepo, mockSessionRepo);
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({ id: '1', email: 'test@test.com' } as any);
      vi.mocked(CryptoUtil.hashPassword).mockResolvedValue('hashedpassword');

      const result = await authService.register({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@test.com', passwordHash: 'hashedpassword' })
      );
    });

    it('should throw BadRequestError if user already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com' } as any);

      await expect(
        authService.register({ email: 'test@test.com', password: 'password123' })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedError if user not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      await expect(
        authService.login({ email: 'nonexistent@test.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
