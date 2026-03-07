import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';

export class TokenService {
  // ============================================
  // PUBLIC METHODS
  // ============================================

  static async generateTokens(userId: number, email: string) {
    // Generate JWT token (15 min)
    const jwtToken = this.generateJWT(userId, email);

    // Generate refreshToken (7 days)
    const refreshToken = this.generateRefreshTokenJWT(userId, email);

    // Calculate expiry date for refreshToken (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refreshToken in database
    await this.storeRefreshTokenInDB(userId, refreshToken, expiresAt);

    // Return both tokens
    return {
      jwtToken,
      refreshToken,
    };
  }

  static async verifyRefreshToken(token: string) {
    try {
      // Verify JWT signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: number;
        email: string;
      };

      // Find token in database
      const refreshTokenRecord = await prisma.refreshTokenRecord.findUnique({
        where: { token },
      });

      if (!refreshTokenRecord) {
        throw new AppError(401, 'Refresh token not found');
      }

      // Check if token is revoked
      if (refreshTokenRecord.revokedAt !== null) {
        throw new AppError(401, 'Refresh token has been revoked');
      }

      // Check if token is expired
      if (new Date() > refreshTokenRecord.expiresAt) {
        throw new AppError(401, 'Refresh token has expired');
      }

      // Return user data
      return {
        id: decoded.id,
        email: decoded.email,
        jwtToken: this.generateJWT(decoded.id, decoded.email),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(401, 'Invalid refresh token');
    }
  }

  static async revokeRefreshToken(token: string) {
    try {
      const refreshTokenRecord = await prisma.refreshTokenRecord.findUnique({
        where: { token },
      });

      if (!refreshTokenRecord) {
        throw new AppError(401, 'Refresh token not found');
      }

      // Mark token as revoked by setting revokedAt to current time
      await prisma.refreshTokenRecord.update({
        where: { token },
        data: {
          revokedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to revoke refresh token');
    }
  }

  static async revokeAllUserTokens(userId: number) {
    try {
      const result = await prisma.refreshTokenRecord.updateMany({
        where: { userId },
        data: {
          revokedAt: new Date(),
        },
      });

      return {
        success: true,
        revokedCount: result.count,
      };
    } catch (err) {
      console.error('Token error:', err);
      throw new AppError(500, 'Failed to revoke user tokens');
    }
  }

  static generateNewJWT(userId: number, email: string): string {
    return this.generateJWT(userId, email);
  }
  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private static generateJWT(userId: number, email: string): string {
    const payload = {
      id: userId,
      email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: '15m',
    });

    return token;
  }

  private static generateRefreshTokenJWT(
    userId: number,
    email: string
  ): string {
    const payload = {
      id: userId,
      email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: '7d', // 7 days
    });

    return token;
  }

  private static async storeRefreshTokenInDB(
    userId: number,
    token: string,
    expiresAt: Date
  ) {
    try {
      const refreshTokenRecord = await prisma.refreshTokenRecord.create({
        data: {
          token,
          userId,
          expiresAt,
          revokedAt: null,
        },
      });

      return refreshTokenRecord;
    } catch (err) {
      console.error('Token verification error:', err);
      throw new AppError(500, 'Failed to store refresh token');
    }
  }

  private static async cleanupExpiredTokens() {
    try {
      await prisma.refreshTokenRecord.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(), // Delete tokens where expiresAt < now
          },
        },
      });
    } catch (error) {
      // Silently fail - cleanup is not critical
      console.error('Failed to cleanup expired tokens:', error);
    }
  }
}
