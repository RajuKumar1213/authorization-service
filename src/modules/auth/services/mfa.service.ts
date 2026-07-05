const { authenticator } = require('otplib');
import QRCode from 'qrcode';
import { db } from '../../../database';
import { twoFactorAuth, recoveryCodes } from '../../../database/schema/mfa';
import { eq } from 'drizzle-orm';
import { BadRequestError } from '../../../core/errors';
import { CryptoUtil } from '../../../shared/utils/crypto';

export class MfaService {
  async generateTotpSecret(userId: string, email: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'IdentityPlatform', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Store in DB temporarily (not enabled yet)
    await db.insert(twoFactorAuth).values({
      userId,
      secret,
      isEnabled: false,
    }).onConflictDoUpdate({
      target: twoFactorAuth.userId,
      set: { secret, isEnabled: false },
    });

    return {
      secret,
      qrCodeUrl,
    };
  }

  async verifyAndEnableTotp(userId: string, token: string) {
    const [tfa] = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId)).limit(1);

    if (!tfa || tfa.isEnabled) {
      throw new BadRequestError('MFA is already enabled or not initialized');
    }

    const isValid = authenticator.verify({ token, secret: tfa.secret });
    if (!isValid) {
      throw new BadRequestError('Invalid TOTP token');
    }

    await db.update(twoFactorAuth).set({ isEnabled: true }).where(eq(twoFactorAuth.userId, userId));

    // Generate recovery codes
    const codes = await this.generateRecoveryCodes(userId);
    return { codes };
  }

  async verifyTotp(userId: string, token: string) {
    const [tfa] = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId)).limit(1);

    if (!tfa || !tfa.isEnabled) {
      throw new BadRequestError('MFA is not enabled');
    }

    return authenticator.verify({ token, secret: tfa.secret });
  }

  async disableMfa(userId: string, token: string) {
    const isValid = await this.verifyTotp(userId, token);
    if (!isValid) {
      throw new BadRequestError('Invalid TOTP token');
    }

    await db.delete(twoFactorAuth).where(eq(twoFactorAuth.userId, userId));
    await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
  }

  private async generateRecoveryCodes(userId: string) {
    const codes: string[] = [];
    const hashedCodes = [];

    for (let i = 0; i < 10; i++) {
      const code = require('crypto').randomBytes(4).toString('hex');
      codes.push(code);
      hashedCodes.push({
        userId,
        codeHash: await CryptoUtil.hashPassword(code),
      });
    }

    await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
    await db.insert(recoveryCodes).values(hashedCodes);

    return codes;
  }
}
