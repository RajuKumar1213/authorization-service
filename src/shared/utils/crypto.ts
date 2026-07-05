import * as argon2 from 'argon2';

export class CryptoUtil {
  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  static async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  static async generateRandomToken(): Promise<string> {
    const { randomBytes } = await import('crypto');
    return randomBytes(32).toString('hex');
  }

  static async hashToken(token: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(token).digest('hex');
  }
}
