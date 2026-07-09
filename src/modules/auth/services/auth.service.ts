import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { CryptoUtil } from '../../../shared/utils/crypto';
import { JwtUtil } from '../../../shared/utils/jwt';
import { BadRequestError, UnauthorizedError } from '../../../core/errors';
import { env } from '../../../config/env';
import dayjs from 'dayjs';
import { db } from '../../../database';
import { roles, permissions, rolePermissions, userRoles } from '../../../database/schema/roles';
import { eq, inArray } from 'drizzle-orm';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  async register(data: { email: string; password?: string; firstName?: string; lastName?: string }) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestError('User already exists', 'USER_EXISTS');
    }

    let passwordHash: string | null = null;
    if (data.password) {
      passwordHash = await CryptoUtil.hashPassword(data.password);
    }

    const user = await this.userRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return user;
  }

  async login(data: { email: string; password?: string; ipAddress?: string; userAgent?: string; device?: string }) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (data.password) {
      if (!user.passwordHash) {
        throw new UnauthorizedError('Invalid login method');
      }
      const isValid = await CryptoUtil.verifyPassword(user.passwordHash, data.password);
      if (!isValid) {
        throw new UnauthorizedError('Invalid credentials');
      }
    }

    const refreshToken = await CryptoUtil.generateRandomToken();
    const refreshTokenHash = await CryptoUtil.hashToken(refreshToken);

    const expiresInMs = require('ms')(env.REFRESH_TOKEN_EXPIRES_IN) as number;
    const expiresAt = dayjs().add(expiresInMs, 'millisecond').toDate();

    const session = await this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      device: data.device,
      expiresAt,
    });

    await this.userRepository.updateLastLogin(user.id);

    const accessToken = JwtUtil.signToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Fetch user roles and permissions
    const userRoleRecords = await db
      .select({
        roleName: roles.name,
        roleId: roles.id,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

    const roleNames = userRoleRecords.map((r) => r.roleName);
    const roleIds = userRoleRecords.map((r) => r.roleId);

    let permissionRecords: any[] = [];
    if (roleIds.length > 0) {
      permissionRecords = await db
        .select({
          action: permissions.action,
          resource: permissions.resource,
          iconUrl: permissions.iconUrl,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds));
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roleNames,
        permissions: permissionRecords,
      },
    };
  }

  async refresh(sessionId: string, refreshToken: string) {
    const session = await this.sessionRepository.findById(sessionId);
    
    if (!session || session.isRevoked || dayjs().isAfter(session.expiresAt)) {
      if (session && !session.isRevoked) {
        await this.sessionRepository.revoke(session.id);
      }
      throw new UnauthorizedError('Invalid session', 'SESSION_INVALID');
    }

    const hash = await CryptoUtil.hashToken(refreshToken);
    if (session.refreshTokenHash !== hash) {
      // Possible token reuse attack - revoke all user sessions
      await this.sessionRepository.revokeAllForUser(session.userId);
      throw new UnauthorizedError('Invalid refresh token. All sessions revoked.', 'TOKEN_REUSE_DETECTED');
    }

    // Session rotation (sliding session logic could be implemented here)
    const newAccessToken = JwtUtil.signToken({
      userId: session.userId,
      sessionId: session.id,
    });

    return {
      accessToken: newAccessToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Fetch user roles and permissions
    const userRoleRecords = await db
      .select({
        roleName: roles.name,
        roleId: roles.id,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

    const roleNames = userRoleRecords.map((r) => r.roleName);
    const roleIds = userRoleRecords.map((r) => r.roleId);

    let permissionRecords: any[] = [];
    if (roleIds.length > 0) {
      permissionRecords = await db
        .select({
          action: permissions.action,
          resource: permissions.resource,
          iconUrl: permissions.iconUrl,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds));
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: roleNames,
      permissions: permissionRecords,
    };
  }

  async logout(sessionId: string) {
    await this.sessionRepository.revoke(sessionId);
  }
}
